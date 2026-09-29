/* Synthesized for scriptc from pip-session-node.d.ts + pip-session-node.js.
 * See host-display-contract.ts for the rationale. */
import type { PipSessionEvent } from "@zcode/zcode-cua/pip-session";

export interface PipSessionApplyResult {
  applied: boolean;
  reason?: string;
}
export interface PipSessionClientOptions {
  socketPath?: string;
  timeoutMs?: number;
  reconnectAttempts?: number;
  reconnectDelayMs?: number;
  peerChecker?: (peer: unknown) => boolean;
  onDiagnostic?: (diagnostic: { code: string; message?: string }) => void;
}
export interface PipSessionClient {
  enabled: boolean;
  connect(): Promise<void>;
  send(event: PipSessionEvent): Promise<PipSessionApplyResult>;
  close(): void;
}
export function createPipSessionClient(_options?: PipSessionClientOptions): PipSessionClient {
  return {
    enabled: false,
    async connect() {},
    async send() {
      return { applied: false };
    },
    close() {},
  };
}