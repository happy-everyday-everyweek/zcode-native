# zfull PLAN — ZCode 全量（非 UI）→ C 编译线（云端 CI）

## 当前状态（v5.13，2026-09-29 夜）
- **22/22 包编译分析全绿**（总计约 16.6 万句，~83% 静态）；
- **6/22 包 emit C 成功**：rpc、formal-proof、model-option-map、shared-types、i18n、tui；
- v5.13 试验中：`--npm-static zod`（试图把 zod 动态岛转为静态编译）。

## 已解决的里程碑（按时间）
1. GHA 构建线迁移（仓库 happy-everyday-everyweek/zcode-native；REST 推送 /root/zcode_native_push.py）；
2. scriptc 0.1.6→0.1.7（0.1.6 的 runtime-optional InternalCompilerError 在 0.1.7 修复）；
3. zcode-cua 12 模块合成件（zfull/compat/zcua/*.ts：.d.ts 契约 + .js stub 合并）；tsconfig paths 12 条；
4. dom-globals shim v5（CSSStyleDeclaration / HeadersInit=undici / 必填化等）；node-forge 走 paths（compat/node-forge.d.ts）；tui 类型 façade（UI 排除）；
5. 导入形态治理 17 处（node:* default→namespace、iconv/semver/ipaddr/forge；dns/promises→dns）；
6. circular imports：bootstrap handlers/index NATIVE_HANDLERS 惰性化（nativeHandlers()）；
7. scriptc CI 补丁：诊断注入（badType 定位）+ poison-escape catch（scan 阶段 PoisonError 捕获）；
8. emit-c 补齐：pnpm install、generate-libs、core dist 构建、@types/node+undici 重链。

## 剩余问题（emit C 产出维度，按体量）
1. **zod 动态依赖**（contracts/shared/services/core 部分……绝大多数剩余 SC2013/SC1090）——v5.13 试验中；
2. 其它 npm 包动态：@opentelemetry/*（telemetry 等）、@modelcontextprotocol 等；
3. node:vm ×2（core/repl：executors.ts、node-repl-session.ts）——功能级决策项；
4. node:sqlite ×1（adapters session-store）——功能级决策项；
5. 零散：WeakSet、SC2009（过程记录类型）、SC2020 process、SC1090 typeof 等。

## 文件与通道坐标
- 发布树 zgh/（patches/zcode-adaptations.patch + zfull/{entries,shims,compat,profiles,tsconfig.json,PLAN.md} + .github/workflows/build.yml）；
- 同步脚本 /root/zcode_native_sync.sh（v3，compat 用 cp -r）；
- CI：emit-c 矩阵（22 包）+ coverage-sweep；诊断与 poison 补丁在 coverage-sweep 的 install scriptc 之后；
- 本机 scriptc-try = 0.1.7（与 CI 对齐）；两版 tarball 存 dl/c016、dl/c017。

## 下一步
- 视 v5.13 结果决定 zod 路线（npm-static 成功 → 扩大；失败 → 专项静态化或战略决策）；
- aarch64 交叉编译线（NDK + zig → `build --lib` → .so）；
- APK 验证。
