#!/usr/bin/env node
// zcheck/compile-entry.mjs —— 在本地或 GHA 的 job 内，只编译**一个入口**并报告目标文件的错误。
//
// 用法：
//   node zcheck/compile-entry.mjs <entry>             # 例如 node zcheck/compile-entry.mjs server
//   node zcheck/compile-entry.mjs <entry> --file <路径>  # 只统计并打印该文件的错误，有错则退出码 1
//   node zcheck/compile-entry.mjs --list              # 列出可用的入口名
//
// 命令与 GHA sweep 保持一致（见 .github/workflows/build.yml）：
//   在 zfull/ 下执行  node <scriptc> build entries/<entry>.ts --emit ir --dynamic
//
// 若 scriptc 未安装，会先在 scriptc-try/ 下 npm install scriptc@0.1.7（与 CI 相同版本）。

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ZFULL = path.join(ROOT, "zfull");
const ENTRIES = path.join(ZFULL, "entries");
const SCRIPT_C = path.join(ROOT, "scriptc-try", "node_modules", ".bin", "scriptc");
const SCRIPT_C_VERSION = "0.1.7";

function listEntries() {
  if (!existsSync(ENTRIES)) return [];
  return readdirSync(ENTRIES)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.replace(/\.ts$/, ""))
    .sort();
}

function ensureScriptc() {
  if (existsSync(SCRIPT_C)) return true;
  const dir = path.dirname(path.dirname(SCRIPT_C));
  console.log(`[compile-entry] scriptc 未安装，正在 ${dir} 安装 scriptc@${SCRIPT_C_VERSION} ...`);
  mkdirSync(dir, { recursive: true });
  const r = spawnSync("npm", ["install", `scriptc@${SCRIPT_C_VERSION}`, "--no-audit", "--no-fund"], {
    cwd: dir,
    stdio: "inherit",
  });
  return r.status === 0 && existsSync(SCRIPT_C);
}

const argv = process.argv.slice(2);
if (argv.includes("--list") || argv.length === 0) {
  console.log("entries:", listEntries().join(", "));
  process.exit(argv.length === 0 ? 2 : 0);
}

const entry = argv[0];
const fileArgIdx = argv.indexOf("--file");
const targetFile = fileArgIdx >= 0 ? argv[fileArgIdx + 1] : undefined;

if (!existsSync(path.join(ENTRIES, `${entry}.ts`))) {
  console.error(`[compile-entry] 找不到入口 entries/${entry}.ts；可用: ${listEntries().join(", ")}`);
  process.exit(2);
}
if (!ensureScriptc()) {
  console.error("[compile-entry] scriptc 不可用，跳过校验");
  process.exit(3);
}

console.log(`[compile-entry] building entries/${entry}.ts ...`);
const t0 = Date.now();
const r = spawnSync(process.execPath, [SCRIPT_C, "build", `entries/${entry}.ts`, "--emit", "ir", "--dynamic"], {
  cwd: ZFULL,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

const errLines = out.split("\n").filter((l) => /error SC\d+/.test(l));
console.log(`[compile-entry] entry=${entry} errors=${errLines.length} elapsed=${elapsed}s`);

if (targetFile) {
  const hits = errLines.filter((l) => l.includes(targetFile));
  console.log(`[compile-entry] errors mentioning ${targetFile}: ${hits.length}`);
  for (const h of hits.slice(0, 20)) console.log("   ", h);
  process.exit(hits.length ? 1 : 0);
}
for (const l of errLines.slice(0, 20)) console.log("   ", l);
process.exit(errLines.length ? 1 : 0);