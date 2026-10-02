import "../shims/dom-globals.js";
import { z } from "zod";
import {
  pendingInteractionSchema,
  permissionRequestPayloadSchema,
  interactionAutoResolutionSchema,
} from "@zcode/shared/zcode-protocol-v4/snapshot.js";

// 1) 单个 payload schema 的输出是否精确
export type PayloadT = (typeof permissionRequestPayloadSchema)["_output"];
export function fPayload(x: PayloadT): string {
  const k: string = x.kind;
  return k;
}

// 2) 另一个判别联合（自动解析）
export type AutoT = (typeof interactionAutoResolutionSchema)["_output"];
export function fAuto(x: AutoT): string {
  const s: string = x.state;
  return s;
}

// 3) 外层对象（含 DU 字段）的输出
export type PendT = (typeof pendingInteractionSchema)["_output"];
export function fPending(x: PendT): string {
  const id: string = x.interactionId;
  const kind: string = x.payload.kind;
  return id + kind;
}

export function main(): number {
  const r = pendingInteractionSchema.safeParse({
    interactionId: "x",
    kind: "permission",
    anchorRowId: null,
    createdAt: 1,
    payload: { kind: "permission" },
  });
  return r.success ? 1 : 0;
}

// 4) 本地复刻：object + superRefine 链上，回调参数内的 DU 字段是否可用
export const localPending = z
  .object({
    interactionId: z.string(),
    kind: z.enum(["permission", "userInput"]),
    payload: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("permission"), v: z.string() }),
      z.object({ kind: z.literal("userInput"), w: z.number() }),
    ]),
  })
  .superRefine((inter, ctx) => {
    if (inter.kind !== inter.payload.kind) {
      ctx.addIssue({ code: "custom", path: ["kind"], message: "mismatch" });
    }
  });

export function fLocal(x: (typeof localPending)["_output"]): string {
  return x.interactionId + x.payload.kind;
}