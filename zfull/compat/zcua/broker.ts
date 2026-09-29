/* Synthesized for scriptc from broker.d.ts + broker.js.
 * See host-display-contract.ts for the rationale. */
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const BROKER_SOCKET_ENV: string = "ZCODE_CUA_PERMISSION_BROKER_SOCKET";
export const BROKER_UNAVAILABLE_ENV: string = "ZCODE_CUA_PERMISSION_BROKER_UNAVAILABLE";

export class BrokerError extends Error {
  code: string;
  details?: unknown;
  constructor(message?: string, options: { code?: string; details?: unknown } = {}) {
    super(message ?? "Computer Use broker is unavailable.");
    this.name = "BrokerError";
    this.code = options.code ?? "unavailable";
    if (options.details !== undefined) this.details = options.details;
  }
}
export class CuaHelperError extends Error {
  code: string;
  constructor(message?: string, options: { code?: string } = {}) {
    super(message ?? "Computer Use Helper is unavailable.");
    this.name = "CuaHelperError";
    this.code = options.code ?? "helper_unavailable";
  }
}
export function isCuaHelperError(value: unknown): value is CuaHelperError {
  return value instanceof CuaHelperError;
}
const brokerErrorFactory = (code: string) =>
  (message?: string, details?: unknown): BrokerError =>
    new BrokerError(message ?? code, { code, details });
export const notAuthorized = brokerErrorFactory("not_authorized");
export const notSelectable = brokerErrorFactory("not_selectable");
export const notSettable = brokerErrorFactory("not_settable");
export const elementUnavailable = brokerErrorFactory("element_unavailable");
export const actionUnavailable = brokerErrorFactory("action_unavailable");
export const foregroundRequired = brokerErrorFactory("foreground_required");

export interface HelperHealth {
  bundleId: string | null;
  pid: number | null;
}
export interface CallBrokerMethodArgs {
  socketPath: string;
  method: string;
  params?: unknown;
  timeoutMs?: number;
}
export async function callBrokerMethod<T = unknown>(_args: CallBrokerMethodArgs): Promise<T> {
  throw new BrokerError("Computer Use is not available in this build.");
}
export interface ProbeHelperHealthOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
  perTryTimeoutMs?: number;
}
export async function probeHelperHealth(
  _socketPath: string,
  _options?: ProbeHelperHealthOptions,
): Promise<HelperHealth> {
  return { bundleId: null, pid: null };
}
export interface SocketPathOptions {
  dir?: string;
  env?: Record<string, string | undefined>;
}
export function mintBrokerSocketPath(options: SocketPathOptions = {}): string {
  const dir = typeof options.dir === "string" ? options.dir : tmpdir();
  return join(dir, `zcode-cua-broker-${randomUUID()}.sock`);
}
export function resolveBrokerSocketPath(options: SocketPathOptions = {}): string {
  const env = options.env ?? process.env;
  const fromEnv = env[BROKER_SOCKET_ENV];
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv;
  return mintBrokerSocketPath(options);
}
export interface BrokerRequest {
  id?: string | null;
  method: string;
  params?: unknown;
}
export interface BrokerResponse {
  ok: boolean;
  [key: string]: unknown;
}
export function parseRequestLine(_line: string): BrokerRequest | undefined {
  return undefined;
}
export function okResponse(result: unknown): BrokerResponse {
  return { ok: true, result };
}
export function errorResponse(message: string, options: { code?: string } = {}): BrokerResponse {
  return {
    ok: false,
    error: { message, ...(options.code ? { code: options.code } : {}) },
  };
}
export function errorResponseFromException(error: unknown): BrokerResponse {
  return errorResponse(error instanceof Error ? error.message : String(error));
}
export function serializeResponse(response: BrokerResponse): string {
  return `${JSON.stringify(response)}\n`;
}
export type BrokerErrorCode = string;
export type BrokerMethod = string;
export type CuaHelperErrorCode = string;
export type NativeAutomationBackend = Record<string, unknown>;
export interface BrokerHandler {
  (params: unknown, context?: unknown): Promise<unknown>;
}
export async function dispatchRequest(
  _backend: NativeAutomationBackend,
  _request: BrokerRequest,
): Promise<BrokerResponse> {
  throw new CuaHelperError("Computer Use is not available in this build.");
}
export async function handleRequestLine(
  _backend: NativeAutomationBackend,
  _line: string,
): Promise<BrokerResponse> {
  throw new CuaHelperError("Computer Use is not available in this build.");
}
export function isBrokerMethod(_method: string): _method is BrokerMethod {
  return false;
}
export function isReadOnlyBrokerMethod(_method: string): boolean {
  return false;
}

export type CuaPermissionState = "granted" | "stale" | "denied" | "unknown";
export interface CuaPermissionStatus {
  available?: true;
  platform?: string;
  grantOwner: string | null;
  owner?: { display_name?: string } | null;
  accessibility: CuaPermissionState;
  accessibility_probe_ok?: boolean;
  accessibilityProbeOk?: boolean;
  grantOwnerDisplayName?: string | null;
  screenRecording: CuaPermissionState;
  screenCaptureProbeOk?: boolean;
  idle?: boolean;
  reason?: string;
}
export interface CuaPermissionStatusUnavailable {
  available: false;
  reason: string;
  idle?: boolean;
  grantOwnerDisplayName?: string | null;
}
export type CuaPermissionStatusResult = CuaPermissionStatus | CuaPermissionStatusUnavailable;
export interface CuaPermissionStatusQueryOptions {
  probeScreenCapture?: boolean;
  [key: string]: unknown;
}
export interface CuaPermissionRestartResult {
  ok: boolean;
  reason?: string;
  [key: string]: unknown;
}
export interface CuaPermissionRestartOptions {
  onboardingSessionId?: string;
  reason?: string;
  beforeFreshStart?: () => void;
  [key: string]: unknown;
}
export interface ICuaPermissionService {
  getStatus(
    workspacePath: string,
    workspaceIdentity?: string,
    options?: CuaPermissionStatusQueryOptions,
  ): Promise<CuaPermissionStatusResult>;
  restartHelper(
    workspacePath?: string,
    workspaceIdentity?: string,
    options?: CuaPermissionRestartOptions,
  ): Promise<CuaPermissionRestartResult>;
}