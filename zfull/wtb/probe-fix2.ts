// 微探针 v2：用真实的 WorkflowRunState 类型（type-only import）测 canonicalWorkflowRun 的候选写法。
import "../shims/dom-globals.js";
import type { WorkflowRunState } from "@zcode/shared/zcode-protocol-v4/workflow-runs.js";

const KEYS: string[] = ["runId", "status", "usage", "lastEventSequence"];

function readFieldAny(source: any, key: string): any {
  return source[key];
}

function readFieldUnknown(source: any, key: string): unknown {
  return source[key];
}

// 候选 A：any 绑定 + 返回 any 的 helper，写进 Record<string, unknown>。
export function candidateAnyHelper(input: WorkflowRunState): WorkflowRunState {
  const source: any = input;
  const canonical: Record<string, unknown> = {};
  for (const key of KEYS) {
    const value = readFieldAny(source, key);
    if (value !== undefined) canonical[key] = value;
  }
  return canonical as unknown as WorkflowRunState;
}

// 候选 B：helper 返回 unknown。
export function candidateUnknownHelper(input: WorkflowRunState): WorkflowRunState {
  const source: any = input;
  const canonical: Record<string, unknown> = {};
  for (const key of KEYS) {
    const value = readFieldUnknown(source, key);
    if (value !== undefined) canonical[key] = value;
  }
  return canonical as unknown as WorkflowRunState;
}

// 候选 C：any 绑定直接索引。
export function candidateDirectAny(input: WorkflowRunState): WorkflowRunState {
  const source: any = input;
  const canonical: Record<string, unknown> = {};
  for (const key of KEYS) {
    const value = source[key];
    if (value !== undefined) canonical[key] = value;
  }
  return canonical as unknown as WorkflowRunState;
}

// 候选 D：any 绑定直接索引，输出用 Record<string, any>。
export function candidateDirectAnyOut(input: WorkflowRunState): WorkflowRunState {
  const source: any = input;
  const canonical: Record<string, any> = {};
  for (const key of KEYS) {
    const value = source[key];
    if (value !== undefined) canonical[key] = value;
  }
  return canonical as WorkflowRunState;
}

export function main(): number {
  const s = JSON.parse('{"runId":"r1","status":"running"}');
  const a = JSON.stringify(candidateAnyHelper(s)).length;
  const b = JSON.stringify(candidateUnknownHelper(s)).length;
  const c = JSON.stringify(candidateDirectAny(s)).length;
  const d = JSON.stringify(candidateDirectAnyOut(s)).length;
  return a + b + c + d;
}

main();
