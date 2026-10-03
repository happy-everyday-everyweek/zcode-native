// 探针（不属于交付树）：编译 run118 共享通道四个文件的诊断子图。
import "../shims/dom-globals.js";
import { createMemoryDiagnosticsRegistry } from "@zcode/shared/memoryDiagnostics.js";
import { workflowArtifactSummary } from "@zcode/shared/zcode-protocol-v4/workflow-runs-artifacts.js";
import { sessionSummarySchema } from "@zcode/shared/zcode-protocol-v4/sessions-index.js";
import { conversationTopicWireFrameSchema } from "@zcode/shared/zcode-protocol-v4/transport.js";

export function probeRegister(): number {
  const registry = createMemoryDiagnosticsRegistry();
  const handle = registry.register("probe", (): Record<string, number> => ({ count: 1 }));
  const collected = registry.collect();
  handle.dispose();
  return collected["probe.count"] ?? -1;
}

export function probeArtifact(value: unknown): boolean {
  return workflowArtifactSummary(value) !== undefined;
}

export function probeSession(value: unknown): boolean {
  return sessionSummarySchema.safeParse(value).success;
}

export function probeWire(value: unknown): boolean {
  return conversationTopicWireFrameSchema.safeParse(value).success;
}

// 顶层调用保证四个函数体都被 lowering（未可达的函数会被剪枝）。
export function main(): number {
  let n = 0;
  if (probeRegister() >= 0) n += 1;
  if (probeArtifact({})) n += 1;
  if (probeSession({})) n += 1;
  if (probeWire({})) n += 1;
  return n;
}

main();

