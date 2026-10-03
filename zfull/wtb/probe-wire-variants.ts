// 微探针：wire.ts superRefine 里 three variants: 现状双 cast / 直接读 any / 带类型局部记录。
import { z } from "zod";

type TopicWireFrame<F> =
  | {
      wireVersion: number;
      kind: "complete";
      deliveryKind: string;
      logicalFrameId: string;
      logicalFrameOrdinal: number;
      topic: string;
      subscriptionId: string;
      frame: F;
    }
  | {
      wireVersion: number;
      kind: "fragment";
      deliveryKind: string;
      logicalFrameId: string;
      logicalFrameOrdinal: number;
      topic: string;
      subscriptionId: string;
      fragmentIndex: number;
      fragmentCount: number;
      logicalBytes: number;
      dataBase64: string;
    };

const kindSchema = z.enum(["initial", "online", "recovery"]);

function currentVariant<F extends z.ZodTypeAny>(frameSchema: F) {
  return z
    .discriminatedUnion("kind", [
      z.object({
          kind: z.literal("complete"),
          deliveryKind: kindSchema,
          logicalFrameId: z.string().min(1),
          logicalFrameOrdinal: z.number(),
          topic: z.string().min(1),
          subscriptionId: z.string().min(1),
          frame: frameSchema,
        })
        .strict(),
      z.object({
          kind: z.literal("fragment"),
          deliveryKind: kindSchema,
          logicalFrameId: z.string().min(1),
          logicalFrameOrdinal: z.number(),
          topic: z.string().min(1),
          subscriptionId: z.string().min(1),
          fragmentIndex: z.number(),
          fragmentCount: z.number(),
          logicalBytes: z.number(),
          dataBase64: z.string(),
        })
        .strict(),
    ])
    .superRefine((wire, context) => {
      const value = wire as unknown as TopicWireFrame<z.output<F>>;
      if (value.kind === "fragment") {
        return;
      }
      const frame = value.frame as {
        topic?: unknown;
        subscriptionId?: unknown;
      };
      if (frame.topic !== value.topic) {
        context.addIssue({ code: "custom", message: "topic mismatch", path: ["topic"] });
      }
      if (frame.subscriptionId !== value.subscriptionId) {
        context.addIssue({
          code: "custom",
          message: "subscriptionId mismatch",
          path: ["subscriptionId"],
        });
      }
    });
}

function directVariant<F extends z.ZodTypeAny>(frameSchema: F) {
  return z
    .discriminatedUnion("kind", [
      z.object({
          kind: z.literal("complete"),
          deliveryKind: kindSchema,
          logicalFrameId: z.string().min(1),
          logicalFrameOrdinal: z.number(),
          topic: z.string().min(1),
          subscriptionId: z.string().min(1),
          frame: frameSchema,
        })
        .strict(),
      z.object({
          kind: z.literal("fragment"),
          deliveryKind: kindSchema,
          logicalFrameId: z.string().min(1),
          logicalFrameOrdinal: z.number(),
          topic: z.string().min(1),
          subscriptionId: z.string().min(1),
          fragmentIndex: z.number(),
          fragmentCount: z.number(),
          logicalBytes: z.number(),
          dataBase64: z.string(),
        })
        .strict(),
    ])
    .superRefine((wire, context) => {
      if (wire.kind === "fragment") {
        return;
      }
      const frame = wire.frame;
      if (frame.topic !== wire.topic) {
        context.addIssue({ code: "custom", message: "topic mismatch", path: ["topic"] });
      }
      if (frame.subscriptionId !== wire.subscriptionId) {
        context.addIssue({
          code: "custom",
          message: "subscriptionId mismatch",
          path: ["subscriptionId"],
        });
      }
    });
}

const inner = z.object({ topic: z.string(), subscriptionId: z.string() });
export const currentOk = currentVariant(inner);
export const directOk = directVariant(inner);

export function main(): number {
  let n = 0;
  if (currentOk.safeParse({}).success) n += 1;
  if (directOk.safeParse({}).success) n += 1;
  return n;
}

main();
