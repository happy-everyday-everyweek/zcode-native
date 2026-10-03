// 探针入口（不属于交付树）：只编译 wt-b 工作区的 workflow-runs-delta.ts / delta.ts 及其可达图，
// 用于在改前后对比 scriptc 诊断。tsconfig.json 的 @zcode/shared* 已指向 zcode-wt-b。
import "../shims/dom-globals.js";
import {
  canonicalWorkflowRun,
  workflowRunEntryKey,
  WORKFLOW_RUN_HEADER_KEYS,
} from "@zcode/shared/zcode-protocol-v4/workflow-runs-delta.js";
import {
  workflowRunEntryRefSchema,
  workflowRunHeaderSchema,
} from "@zcode/shared/zcode-protocol-v4/delta.js";

export function probeCanonical(run: any): string {
  return JSON.stringify(canonicalWorkflowRun(run));
}

export function probeEntryKey(siteId: string, ordinal: number): string {
  return workflowRunEntryKey({ siteId, ordinal });
}

export function probeHeaderKeys(): number {
  return WORKFLOW_RUN_HEADER_KEYS.length;
}

export function probeRef(value: any): boolean {
  return workflowRunEntryRefSchema.safeParse(value).success;
}

export function probeHeader(value: any): boolean {
  return workflowRunHeaderSchema.safeParse(value).success;
}
