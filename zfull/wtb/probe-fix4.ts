// 微探针 v4：delta.ts 的 schema 槽（runId / revision）在 CI 兼容层下各自是否报 any→ZBase。
import "../shims/dom-globals.js";
import { z } from "zod";
import {
  workflowRunSchema,
  workflowRunsStateSchema,
} from "@zcode/shared/zcode-protocol-v4/workflow-runs.js";

const workflowRunIdSchema = z.string().min(1).max(128);
const workflowRunRevisionSchema = z.number().int().nonnegative();

// 变体 G：runId 用局部 schema，revision 仍读 .shape（看它自己是否也报）。
const G = z.object({
  op: z.literal("workflowRun.updated"),
  runId: workflowRunIdSchema,
  revision: workflowRunsStateSchema.shape.revision,
});

// 变体 H：两者都用局部 schema。
const H = z.object({
  op: z.literal("workflowRun.updated"),
  runId: workflowRunIdSchema,
  revision: workflowRunRevisionSchema,
});

// 变体 I：只留 .shape.runId（对照，确认原报错形态）。
const I = z.object({
  op: z.literal("workflowRun.updated"),
  runId: workflowRunSchema.shape.runId,
  revision: workflowRunRevisionSchema,
});

export function main(): number {
  const a = G.safeParse({ op: "workflowRun.updated", runId: "r1", revision: 1 }).success ? 1 : 0;
  const b = H.safeParse({ op: "workflowRun.updated", runId: "r1", revision: 1 }).success ? 2 : 0;
  const c = I.safeParse({ op: "workflowRun.updated", runId: "r1", revision: 1 }).success ? 4 : 0;
  return a + b + c;
}

main();
