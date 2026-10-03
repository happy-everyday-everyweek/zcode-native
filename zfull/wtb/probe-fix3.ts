// 微探针 v3：必填 header 键的两种求法（E=值类型记录 + String(key) 派生；F=显式清单）。
import "../shims/dom-globals.js";
import { workflowRunSchema } from "@zcode/shared/zcode-protocol-v4/workflow-runs.js";

type HK = "runId" | "status" | "usage" | "lastEventSequence" | "toolCallId" | "actors" | "nodes";

const HDR: HK[] = ["runId", "status", "usage", "lastEventSequence", "toolCallId", "actors", "nodes"];

// 候选 E：把 .shape 的 any 值赋给「值类型记录」，用 String(key) 索引。
const shapeE: Record<string, { safeParse: (value: unknown) => { success: boolean } }> =
  workflowRunSchema.shape;
export const REQ_E: readonly HK[] = HDR.filter(
  (key: string): boolean => !shapeE[String(key)].safeParse(undefined).success,
) as HK[];

// 候选 F：显式清单。
export const REQ_F: readonly HK[] = ["runId", "status", "usage", "lastEventSequence"];

export function main(): number {
  const e = REQ_E.length;
  const f = REQ_F.length;
  return e * 100 + f;
}

main();
