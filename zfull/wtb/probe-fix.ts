// 微探针：验证候选改法在 scriptc 下是否可编译（改 src 之前先在这里筛写法）。
import "../shims/dom-globals.js";
import { z } from "zod";

interface Shape {
  a: string;
  b?: number;
}

const KEYS: string[] = ["a", "b"];

function readFieldAny(source: any, key: string): any {
  return source[key];
}

function readFieldUnknown(source: any, key: string): unknown {
  return source[key];
}

// 候选 1：any 绑定 + 返回 any 的 helper，写进 Record<string, any>。
export function variantHelperAny(input: Shape): Shape {
  const source: any = input;
  const out: Record<string, any> = {};
  for (const key of KEYS) {
    const value = readFieldAny(source, key);
    if (value !== undefined) out[key] = value;
  }
  return out as unknown as Shape;
}

// 候选 2：helper 返回 unknown，写进 Record<string, unknown>。
export function variantHelperUnknown(input: Shape): Shape {
  const source: any = input;
  const out: Record<string, unknown> = {};
  for (const key of KEYS) {
    const value = readFieldUnknown(source, key);
    if (value !== undefined) out[key] = value;
  }
  return out as unknown as Shape;
}

// 候选 3：any 绑定直接索引。
export function variantDirectAny(input: Shape): Shape {
  const source: any = input;
  const out: Record<string, unknown> = {};
  for (const key of KEYS) {
    const value = source[key];
    if (value !== undefined) out[key] = value;
  }
  return out as unknown as Shape;
}

type HK = "runId" | "status" | "usage" | "toolCallId" | "actors" | "nodes";
const ALL: string[] = ["runId", "status", "usage", "toolCallId", "actors", "nodes"];

// 候选 4：boolean 谓词 + 结果数组转型。
export const HEADER_KEYS: readonly HK[] = ALL.filter(
  (key: string): boolean => key !== "actors" && key !== "nodes",
) as HK[];

// 候选 5：必填 header 键的显式清单。
export const REQUIRED_HEADER_KEYS: readonly HK[] = ["runId", "status", "usage"];

// 候选 6：delta.ts 的局部 runId schema（替代 schema.shape.runId）。
const workflowRunIdSchema = z.string().min(1).max(128);
const deltaShape = z.object({ runId: workflowRunIdSchema, revision: z.number() });

export function variantLocalSchema(value: unknown): boolean {
  return deltaShape.safeParse(value).success;
}

export function variantSet(): number {
  const set: ReadonlySet<string> = new Set<string>(KEYS);
  return set.size;
}

export function main(): number {
  const a = variantHelperAny({ a: "x" }).a.length;
  const b = variantHelperUnknown({ a: "xx" }).a.length;
  const c = variantDirectAny({ a: "xxx" }).a.length;
  const d = HEADER_KEYS.length + REQUIRED_HEADER_KEYS.length;
  const e = variantLocalSchema({ runId: "r1", revision: 1 }) ? 1 : 0;
  const f = variantSet();
  return a + b + c + d + e + f;
}

main();
