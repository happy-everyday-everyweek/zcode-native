# ZCode 全量编译工程（zfull 工作域）· 作战计划

> 创建于 2026-09-29。口径：把 ZCode 全部代码（非 UI）在语义不变前提下编译成 C，最终产出安卓兼容 .so 并经 APK 验证。

## 一、任务口径

- 目标链：ZCode TS 源码 → scriptc 编译（C 输出 + 原生归档）→ aarch64-linux-android 库 → .so → APK。
- 排除范围：packages/ui、packages/web、packages/desktop（UI/桌面端）；packages/zcode-cua（发布物为预编译 JS，无 TS 源）。
- 不依赖 JS 运行时（不用 --dynamic 动态引擎）。
- 语义不变：一切源码改造须保持行为；对照测试与最小机械改动为纪律。

## 二、工具链与关键机制（实测确认）

- scriptc：0.1.6 包装 + @scriptc/compiler 0.1.7，位于 scriptc-try。
- governing tsconfig：entry 文件的最近 tsconfig 决定检查配置（仅被采纳的 strictness knobs）；lib/module/target 由 scriptc 强制（lib=es2025+esnext.disposable，无 DOM）。
- strictNullChecks 必须开启，否则拒绝分析。
- @types/node 会被采纳（探测 node_modules/@types/node）；其依赖 undici-types 提供 fetch 一族全局类型。
- DOM 类型缺口：ambient .d.ts 与三斜线引用无效；唯一有效途径是"被 import 的模块内 declare global"（已测）。
- npm-static：对 zod 的 shipped CJS 预检拒绝（SC1013 require 模式）。
- provenance-sources：zod 可经此通道从源码编译（缓存 /root/.cache/scriptc/provenance/<commit>）。
- 循环导入（SC1016）：循环成员模块顶层必须"declaration-only"；修法=把顶层运行时语句移进函数体 或 断环（搬迁共享绑定）。样板：zod core./util 断环（globalConfig 拆到 config.ts）。
- C 输出：--emit c（可读 C）与 --backend c 行为一致；默认 lane 对超出 LLVM 层的程序也会回退 C 发射（native 目标）。

## 三、目录结构

- zfull/entries/*.ts：每包一个编译入口（export * from "@zcode/..."）。
- zfull/tsconfig.json：全包 paths 映射 + strict + types:["node"] + typeRoots 指向 ZCode 的 @types。
- zfull/node_modules/@types/node：symlink 到 ZCode 的 @types/node（供采纳探测）。
- zfull/reports/：第一轮扫描（按 ZCode 原生 tsconfig 语境）。
- zfull/reports2/：第二轮扫描（zfull 域语境，现行基线）。
- zfull/vendor/zod：zod 源码 vendor 副本（已打补丁：_E 惰性化 + globalConfig 拆分断环）。
- zcode-port/：M1 切片构建区（port-entry、build.sh、jni、链接配方、libzcodecore.so）。

## 四、第一轮测绘结论（reports/，20 包）

- 直接可分析（4）：contracts 73%（5948 句）、dynamic-workflow 93%（2576 句）、rpc 91%（236 句）、shared-types（纯类型）。
- typecheck 阶段中止（15）：core（1 错：DOM Element）、动态工作流运行时（20）、adapters（425）、bootstrap（1275）、telemetry（15）、i18n（5）、cli（194）、tui（5）、provider（24）、provider-node（22）等。
- strictNullChecks 中止（7）：shared、services、client、server、zcode-server-cli、model-option-map（后三者的代码修复量：client 6、zcode-server-cli 20、server 56、services 880）。
- 结论：多数"typecheck 错误"疑为原生语境差异；以 zfull 域（reports2）为准重扫。

## 五、关键战役

1. DOM shim：core 等用 DOM 类型处。做法：zfull/shims/dom-globals.ts（declare global）由 entry import。
2. zod 深水区：过 typecheck+循环后 953 句/54% 静态；余下 blocker 以 SC2001（$constructor 泛型族）、SC2009（CheckAggregate 等）、SC2011（回调函数值）为主。
3. services 严格化：880 处 strictNullChecks 修复。
4. 循环/顶层语句清扫：逐包按 SC1016 提示修。
5. 逐包 blocker 清扫：SC1090/2004/2006/2009/2011/2020 等。

## 六、阶段计划

- P0（进行中）：zfull 域全量重扫（sweep2）；DOM shim 试验；确立"包 → C"端到端样板（候选：rpc、dynamic-workflow）。
- P1：主链清洁：core、contracts、shared、shared-types、dynamic-workflow、rpc。
- P2：外围包清洁：adapters、bootstrap、telemetry、i18n、cli、tui、provider、provider-node、client、server、services、zcode-server-cli、model-option-map、formal-proof、node-repl-host。
- P3：全量产物（每包 --emit c + lib 归档）→ 链接验证 → APK。

## 七、进度日志

- 2026-09-29 上午：全量 20 包首轮测绘完成（reports/）；zod vendor 建立并完成 typecheck+循环突破（基线 54%）；验证 DOM shim 模式；zfull 域建立（entries 22 个、tsconfig、@types symlink）；sweep2（zfull 域重扫）启动。
- 2026-09-29 下午：**zod 版本修正**——contracts 用 zod@3.25.76（^3.24.0），其余包用 4.6.5；撤销全局 zod paths 映射（此前造成 42 个版本错配假错误）。**core 第一批清洁**：environment.ts（isSea 本地化恒定 false）、bash-cwd-policy/path-normalization/read-file-state（去 node:process 导入，改用全局 process.platform）、agent-runtime.ts（installAgentRuntimeMethods 惰性化：首次构造时装，修 SC1016 循环）。**rpc 第一波**：foundation.ts 两处 Set 数组化（DisposableStore.items、Emitter.listeners）+ Event.None→Event<never>。重跑验证（core/contracts/rpc）进行中。
- **待对齐清单（功能级降级决策）**：① node:vm ×2（core/repl 的 JS 执行环境，原生无 JS 引擎）；② 'typescript' 包依赖（dynamic-workflow 运行时分析，编译它不现实）；③ 其它 Node-only 模块（node:sea 已本地化）。处理方向候选：stub 化（接口保留+运行报错）或裁剪。

## 八、zod 战役设计（最大深水区）

现状：三份 zod 源码副本均已就位备攻——zfull/vendor/zod（4.6.5，已打 2 补丁）、zfull/vendor/zod3（3.25.76，npm 包 src 整包拷贝，含 v3/v4 混合）。
- zod4 基线：953 句/54% 静态；根因族=SC2001（$constructor 泛型族）、SC2009（CheckAggregate）、SC2011（回调函数值）。
- zod3 基线（最小实验图）：180 句/65% 静态；根因族=**SC2005 泛型函数值**（20+ 个工厂函数 `z.array/z.object/...` 作为"值"导出无法单态化）、**泛型类 extends 族**（SC1090×19+13）、类声明受阻（SC2004 群）、stdlib 缺口（Object.keys 等）。
- 路线候选：a) 源码手术（把泛型工厂改为具体实例/重载包装——工程量巨大）；b) scriptc 编译器增强（对泛型函数值的延迟单态化——需深入/或上游）；c) **暂缓机制**：先把所有非 zod 卡点清零，zod 作为"最后前沿"集中强攻（期间它在图上保持 island/dynamic 状态）。**排期建议：采用 c，向用户对齐"zod 是最后一个战役、体量最大"这一事实。**
- 解锁价值：zod 一旦能源码编译，contracts/core/shared 的 SC1090×~550、SC2013×2200+ 立即改观——**总杠杆最大**。

## 九、sweep3 与污染修正（2026-09-29 中午）

- 发现 sweep2 部分报告（adapters/bootstrap/cli/i18n/telemetry/tui 等）生成在 zod 全局映射期间（11:05-11:17），含 12-3 条/包的假错误（Expected 2-3 arguments 等）——已识别。
- 修正动作：撤销 zod 全局映射；补 zcode-cua 12 条子路径映射；DOM shim v2（window/document/location/HTMLElement/HTMLInputElement/DOMRect/HeadersInit）；全部 entries 加 shim import；sweep3 全量重扫（22 包，输出 reports2/，旧数据快照 logs/reports2-snapshot-1125.tgz）。
- 备份：core/contracts/rpc 的 rerun3 版本为 *.rerun3.cov.log。

## 十、rpc 样板里程碑与修复范式（2026-09-29 下午）

- rpc 三波+四波改造：foundation.ts（Set→数组、Event.None→never、Emitter.event getter→field）、channelClient.ts（activeRequests数组化、pendingRejections→数组）、ipc.ts（_connections数组化）。
- **getter返回闭包不可 lower（SC1090）**；修复范式=改为类字段箭头闭包（100% 静态）。**全库同类模式排查列入后续工作。**
- 对照实验：原版 vs 改版唯一差异=identity（因 getter→field），其余全一致（已挂账）。
- 对照工具链：git show + esbuild bundle + node + diff（tsx 不可用）。
- 设备中断（11:31-13:42）后恢复：sweep3b（18 包续扫）与 rpc-lib 构建已重启。
- 已产出 C 的包：rpc（111KB）、formal-proof（30KB）、model-option-map（50KB）。
