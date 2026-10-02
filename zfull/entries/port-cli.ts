// zcode-port/port-cli.ts
// 动态层可执行入口：在 Android aarch64 上跑真实的 ZCode 契约代码
// （真实 zod-lite 校验 + 真实 workflow run schema / delta 纯函数 + 网络策略）。
// 构建：scriptc build port-cli.ts --emit=exe --dynamic
import { createSessionId, createTurnId, createEventId, createTraceId } from "@zcode/contracts/interfaces/shared.js";
import { uuidv7, createUuid } from "@zcode/shared/uuid.js";
import { getPublicEgressIpBlockReason } from "@zcode/contracts/network/public-egress-ip.js";
import { workflowRunSchema } from "@zcode/shared/zcode-protocol-v4/workflow-runs.js";
import { canonicalWorkflowRun, workflowRunEntryKey } from "@zcode/shared/zcode-protocol-v4/workflow-runs-delta.js";
import { workflowRunEntryRefSchema } from "@zcode/shared/zcode-protocol-v4/delta.js";

function verdict(r: any): string {
  if (r === null || r === undefined) return "null";
  return r.success ? "ok" : "invalid";
}

function egressVerdict(ip: string): string {
  const r = getPublicEgressIpBlockReason(ip);
  if (r === undefined) return "allowed";
  return r.reason;
}

function emit(name: string, value: string): void {
  console.log(name + "=" + value);
}

function run(): void {
  console.log("ZCODE_PORT_CLI_BEGIN");

  emit("sessionId", createSessionId());
  emit("turnId", createTurnId());
  emit("eventId", createEventId());
  emit("traceId", createTraceId());
  emit("uuid7", uuidv7());
  emit("uuid", createUuid());

  emit("egress.10.0.0.5", egressVerdict("10.0.0.5"));
  emit("egress.8.8.8.8", egressVerdict("8.8.8.8"));
  emit("egress.::1", egressVerdict("::1"));

  // 真 schema 正例：entryRef 只要求 siteId + ordinal。
  const refOk: any = workflowRunEntryRefSchema.safeParse({ siteId: "site-a", ordinal: 3 });
  emit("entryRef.valid", verdict(refOk));
  const refMiss: any = workflowRunEntryRefSchema.safeParse({ siteId: "site-a" });
  emit("entryRef.missing_ordinal", verdict(refMiss));
  const refNeg: any = workflowRunEntryRefSchema.safeParse({ siteId: "site-a", ordinal: -1 });
  emit("entryRef.negative_ordinal", verdict(refNeg));
  const refType: any = workflowRunEntryRefSchema.safeParse({ siteId: 7, ordinal: 1 });
  emit("entryRef.wrong_type", verdict(refType));

  // 真 schema 反例：run 的必填键整体缺席。
  const runEmpty: any = workflowRunSchema.safeParse({});
  emit("run.empty", verdict(runEmpty));

  // 真实纯函数：去重键与规范键序重建。
  emit("entryKey", workflowRunEntryKey({ siteId: "site-a", ordinal: 3 }));
  emit("canonical", JSON.stringify(canonicalWorkflowRun(JSON.parse('{"runId":"r1","status":"running"}'))));

  console.log("ZCODE_PORT_CLI_END");
}

run();
