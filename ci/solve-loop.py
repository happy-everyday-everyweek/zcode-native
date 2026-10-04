#!/usr/bin/env python3
"""solve-loop.py —— 云端闭环修错：编译反馈 + agent 迭代，全程在 GHA 上跑

和 agent-fanout 的区别：那里每个文件一个 job、agent 看不到编译结果（盲修，一次机会）；
这里是**一个 job 内多轮循环**，每轮都跑真实 sweep，把「该文件当前的真实错误」喂给 agent，
改完立刻重编该入口，错误没减少就回滚。这样它自己迭代到清零。

用法（在 job 里）：
  python3 ci/solve-loop.py --rounds 6 --per-round 8 --repo-root "$PWD"

每轮的流程：
  1. 对 entries/*.ts 全量 sweep（scriptc build --emit ir --dynamic），解析出 文件→错误
  2. 总数为 0 就停
  3. 挑 per-round 个候选文件（优先「上一轮修过但仍有错」的，其次错误数多的）
  4. 逐个：把「文件 + 当前错误原文 + 硬约束」写成 prompt → zcode -p → 重编该入口数该文件错误
     * 错误数减少 → git commit 该文件（保留）
     * 没减少或更多 → git checkout 掉（回滚），记一笔
  5. 回到 1

结束前把 ORIG（upstream 基准）到当前的完整 diff 导出成一份补丁 artifact。
"""
import argparse
import json
import os
import pathlib
import re
import subprocess
import sys
import time

ERR_RE = re.compile(r"^(.*?)(\d+):(\d+) - error (SC\d+): (.*)$")


def sh(cmd, cwd=None, timeout=None, env=None):
    return subprocess.run(cmd, cwd=cwd, timeout=timeout, env=env, capture_output=True, text=True)


def zcode_bin():
    return str(pathlib.Path.home() / ".zcode" / "runtime" / "zcode" / "bin" / "zcode.mjs")


def entry_of(root, f):
    """按路径推断该文件属于哪个入口（用于单入口校验）。"""
    if f.startswith("apps/zcode-cli/packages/"):
        name = f[len("apps/zcode-cli/packages/") :].split("/")[0]
    elif f.startswith("packages/"):
        name = f[len("packages/") :].split("/")[0]
    else:
        return None
    named = {"shared-types": "shared-types", "dynamic-workflow-runtime": "dynamic-workflow-runtime"}
    if name in named:
        return named[name]
    return name if (pathlib.Path(root) / "zfull" / "entries" / (name + ".ts")).exists() else None


def sweep(root, entries, reports):
    """跑全量 sweep，返回 {file: [(entry, line, msg)]}"""
    reports.mkdir(parents=True, exist_ok=True)
    by_file = {}
    total = 0
    scriptc = str(pathlib.Path(root) / "scriptc-try" / "node_modules" / ".bin" / "scriptc")
    for e in entries:
        ent = pathlib.Path(root) / "zfull" / "entries" / (e + ".ts")
        if not ent.exists():
            continue
        log = reports / (e + ".log")
        with open(log, "w") as fh:
            try:
                subprocess.run(
                    ["node", scriptc, "build", "entries/%s.ts" % e, "--emit", "ir", "--dynamic"],
                    cwd=str(pathlib.Path(root) / "zfull"),
                    stdout=fh,
                    stderr=subprocess.STDOUT,
                    timeout=1200,
                )
            except subprocess.TimeoutExpired:
                fh.write("\ntimeout\n")
        for line in log.read_text(errors="replace").splitlines():
            m = ERR_RE.match(line.strip()) if line.startswith("/") else None
            if not m:
                # 报错行形如  <abs path>/ZCode/packages/.../f.ts:12:3 - error SC0001: msg
                m2 = re.search(r"/ZCode/(\S+?):(\d+):(\d+) - error (SC\d+): (.*)$", line)
                if not m2:
                    continue
                f, ln, _, code, msg = m2.groups()
                by_file.setdefault(f, []).append((e, int(ln), code, msg))
                total += 1
                continue
        # 计数用 grep 口径，与 build.yml 一致
    return by_file, total


def entry_error_count(root, entry, file):
    """只编一个入口，数该文件的错误数（用于判断这次编辑有没有用）。"""
    scriptc = str(pathlib.Path(root) / "scriptc-try" / "node_modules" / ".bin" / "scriptc")
    r = sh(
        ["node", scriptc, "build", "entries/%s.ts" % entry, "--emit", "ir", "--dynamic"],
        cwd=str(pathlib.Path(root) / "zfull"),
        timeout=1500,
    )
    out = (r.stdout or "") + (r.stderr or "")
    return sum(1 for l in out.splitlines() if ("/ZCode/" + file) in l and "error SC" in l)


def run_agent(root, prompt, timeout=1200):
    pf = pathlib.Path(root) / "agent-prompt.txt"
    pf.write_text(prompt, encoding="utf-8")
    t0 = time.time()
    try:
        r = subprocess.run(
            ["node", zcode_bin(), "-p", prompt, "--no-color"],
            cwd=root,
            timeout=timeout,
            capture_output=True,
            text=True,
        )
        tail = (r.stdout or "")[-1500:]
    except subprocess.TimeoutExpired:
        tail = "(agent 超时)"
    return round(time.time() - t0, 1), tail


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rounds", type=int, default=5)
    ap.add_argument("--per-round", type=int, default=8)
    ap.add_argument("--repo-root", default=".")
    ap.add_argument("--entries", default="")
    ap.add_argument("--agent-timeout", type=int, default=1200)
    args = ap.parse_args()
    root = pathlib.Path(args.repo_root).resolve()
    zfull = root / "zfull"
    zcode = root / "ZCode"

    entries = [e.strip() for e in args.entries.split(",") if e.strip()]
    if not entries:
        entries = sorted(p.stem for p in (zfull / "entries").glob("*.ts"))

    ORIG = sh(["git", "-C", str(zcode), "rev-parse", "HEAD"]).stdout.strip()
    print("upstream base:", ORIG, flush=True)
    reports = pathlib.Path("/tmp/solve-reports")
    prompt_tpl = (root / "ci" / "fanout-prompt.txt").read_text(encoding="utf-8")

    tried = {}
    for rnd in range(1, args.rounds + 1):
        by_file, total = sweep(root, entries, reports)
        print("\n===== round %d: TOTAL=%d, files=%d" % (rnd, total, len(by_file)), flush=True)
        top = sorted(by_file.items(), key=lambda kv: -len(kv[1]))[:12]
        for f, errs in top:
            print("   %-70s %d" % (f, len(errs)), flush=True)
        if total == 0:
            print("no errors left; done", flush=True)
            break
        cands = sorted(by_file.items(), key=lambda kv: (-(1 if kv[0] in tried else 0), -len(kv[1])))
        targets = [f for f, _ in cands[: args.per_round]]
        for f in targets:
            errs = by_file[f]
            entry = entry_of(root, f) or errs[0][0]
            detail = "\n".join("  line %d: %s: %s" % (ln, code, msg) for _, ln, code, msg in errs[:14])
            prompt = (
                prompt_tpl.replace("{file}", "ZCode/" + f)
                + "\n\nThe compiler currently reports these diagnostics for that exact file:\n"
                + detail
                + "\n\nFix these diagnostics by editing only that file. Keep the edit minimal."
            )
            before = len(errs)
            secs, tail = run_agent(root, prompt, timeout=args.agent_timeout)
            after = entry_error_count(root, entry, f) if entry else before
            verdict = "keep" if after < before else ("revert" if after >= before else "keep")
            print("[%s] %s errors %d -> %d  (entry=%s, %.1fs)" % (verdict, f, before, after, entry, secs), flush=True)
            if verdict == "keep":
                sh(["git", "-C", str(zcode), "add", "-A", "--", f])
                sh(
                    [
                        "git",
                        "-C",
                        str(zcode),
                        "-c",
                        "user.name=gha-agent",
                        "-c",
                        "user.email=gha-agent@users.noreply.github.com",
                        "commit",
                        "-q",
                        "-m",
                        "solve r%d: %s" % (rnd, f),
                    ]
                )
                tried[f] = after
            else:
                sh(["git", "-C", str(zcode), "checkout", "--", f])
                tried[f] = before
                if tail:
                    print("     agent tail:", tail.replace("\n", " ")[:300], flush=True)

    out = pathlib.Path("/tmp/agent-solve.patch")
    d = sh(["git", "-C", str(zcode), "diff", ORIG])
    out.write_text(d.stdout or "")
    print("\nfinal patch bytes:", out.stat().st_size, flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())