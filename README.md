# zcode-native

ZCode 的纯原生（C / aarch64）移植 —— 构建流水线仓库。

本仓库承载"把 ZCode 全部代码（非 UI）编译成 C"工程的**云端构建侧**：
所有构建类任务（scriptc 编译、交叉编译、产物产出）都在 GitHub Actions 上运行，
不依赖本机（Android 设备对重型构建命令敏感）。

## 结构

- `patches/zcode-adaptations.patch` — 对 ZCode 源码的适配补丁（scriptc 静态编译所需的机械改造：
  Set→数组、getter→字段、循环声明化、node:sea/node:process 本地化等）。在干净 v3.14.3 克隆上验证过 `git apply`。
- `zfull/` — ZCode 编译工作区：
  - `entries/*.ts` — 每个包一个编译入口（`export * from "@zcode/..."`）。
  - `profiles/rpc.profile.json` — rpc 包的 lib 构建 profile（C ABI 导出面）。
  - `shims/dom-globals.ts` — DOM 全局类型的 declare-global 补充（scriptc 强制 lib 无 DOM）。
  - `tsconfig.json` — 全包 paths 映射（相对路径：`../ZCode/...`）。
  - `PLAN.md` — 作战计划（进度、机制、待办）。
- `.github/workflows/build.yml` — 构建工作流。

## 工作流约定

- 布局：`ZCode/`（clone 官方仓库 + 应用补丁）、`zfull/`（本仓库自带）、`scriptc-try/`（npm 安装 scriptc）。
- 构建：`cd zfull && node ../scriptc-try/node_modules/.bin/scriptc build entries/<name>.ts --emit c -o out/<name>.c`。
- 产物经 `actions/upload-artifact` 上传。

## 状态（2026-09-29）

- 已能产出 C 的包（本机验证）：rpc（111KB）、formal-proof（30KB）、model-option-map（50KB）。
- 本文仓库第一目标是让 rpc 的 C 产出在 CI 上稳定复现；随后扩展为全量包的矩阵构建与 aarch64 交叉编译（NDK+zig）。
