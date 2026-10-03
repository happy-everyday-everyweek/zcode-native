#!/usr/bin/env python3
"""gha-agent.py —— agent-fanout 工作流在 runner 内用到的三个小步骤（避免在 run: 里内嵌 heredoc）。

子命令：
  prepare                     从环境变量 ZCODE_PROVIDER_CONFIG_B64 还原 ~/.zcode/v2/provider_config.json
  prompt <file>               生成 agent-prompt.txt（模板见 zcheck/fanout-prompt.txt，缺失则用内置）
  verify <entry> <file>       调用 zcheck/compile-entry.mjs 只编该入口并报告该文件的错误
  runtime-url <repo> <asset>  打印 runtime release 资产的下载地址（调试用）

用法示例（在 job 里）：
  env: { ZCODE_PROVIDER_CONFIG_B64: "${{ secrets.ZCODE_PROVIDER_CONFIG_B64 }}" }
  run: python3 zcheck/gha-agent.py prepare
"""
import base64
import json
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

DEFAULT_PROMPT = (
    "Fix ALL scriptc diagnostics reported in the file {file} in this repo. "
    "Edit ONLY that file; never change an exported type declaration; do not add exports. "
    "Rules verified in this port: Object.keys has no lowering on Record<string, any> - add a file-local "
    "generic helper recordKeys<T>(rec: Record<string, T>) and bind a Record<string, unknown> first; "
    "new Set(values) is unsupported - use Set with has/add; object spread of an any source is unsupported; "
    "avoid `in` on any receivers, Object.fromEntries, process, for...in, Function.prototype.call; "
    "an any value can never become a class instance (fix the interface, not the expression). "
    "Do NOT run the compiler (too slow here) - just make the edit and report before/after lines."
)


def prepare() -> int:
    raw = os.environ.get("ZCODE_PROVIDER_CONFIG_B64", "").strip()
    if not raw:
        print("ZCODE_PROVIDER_CONFIG_B64 为空，无法还原 provider 配置")
        return 2
    # 兼容两种存法：直接存原始 JSON（以 { 开头），或存 base64 文本。
    if raw.startswith("{"):
        payload = raw.encode("utf-8")
    else:
        payload = base64.b64decode(raw + "=" * (-len(raw) % 4))
    dest = pathlib.Path.home() / ".zcode" / "v2" / "provider_config.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(payload)
    data = json.loads(dest.read_text(encoding="utf-8"))
    print("providers:", data.get("config", {}).get("providerOrder"))
    return 0


def prompt(file: str) -> int:
    tpl = ROOT / "zcheck" / "fanout-prompt.txt"
    base = tpl.read_text(encoding="utf-8") if tpl.is_file() else DEFAULT_PROMPT
    out = pathlib.Path("agent-prompt.txt")
    out.write_text(base.format(file=file), encoding="utf-8")
    print("prompt bytes:", out.stat().st_size, "->", out)
    return 0


def verify(entry: str, file: str) -> int:
    r = subprocess.run(
        ["node", "zcheck/compile-entry.mjs", entry, "--file", file],
        capture_output=True,
        text=True,
    )
    print(r.stdout[-6000:])
    if r.stderr:
        print("stderr:", r.stderr[-2000:])
    return r.returncode


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cmd = sys.argv[1]
    if cmd == "prepare":
        return prepare()
    if cmd == "prompt" and len(sys.argv) > 2:
        return prompt(sys.argv[2])
    if cmd == "verify" and len(sys.argv) > 3:
        return verify(sys.argv[2], sys.argv[3])
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())