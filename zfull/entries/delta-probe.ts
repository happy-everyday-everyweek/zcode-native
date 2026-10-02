import "../shims/dom-globals.js";
import { conversationDeltaSchema } from "@zcode/shared/zcode-protocol-v4/delta.js";

export type ProbeDelta = (typeof conversationDeltaSchema)["_output"];

export function probeKind(d: ProbeDelta): string {
  return typeof d;
}

export function probeField(d: ProbeDelta): string {
  const op: string = d.op;
  return op;
}

export function main(): number {
  const r = conversationDeltaSchema.safeParse({ op: "noop" });
  return r.success ? 1 : 0;
}