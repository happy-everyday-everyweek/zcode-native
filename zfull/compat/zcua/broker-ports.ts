/* Synthesized for scriptc from broker-ports.d.ts + broker-ports.js.
 * See host-display-contract.ts for the rationale. */
import type {
  CuaPermissionState,
  CuaPermissionStatus,
  CuaPermissionStatusQueryOptions,
  CuaPermissionStatusResult,
  CuaPermissionRestartOptions,
  CuaPermissionRestartResult,
  ICuaPermissionService,
} from "@zcode/zcode-cua/broker";

export function isCuaPermissionStatusAvailable(
  result: CuaPermissionStatusResult | undefined,
): result is CuaPermissionStatus {
  return Boolean(result) && typeof result === "object" && result.available === true;
}
export function shouldRunCuaScreenCaptureProbe(
  _state: CuaPermissionState | undefined,
  _options?: CuaPermissionStatusQueryOptions,
): boolean {
  return false;
}
export type {
  CuaPermissionState,
  CuaPermissionStatus,
  CuaPermissionStatusResult,
  CuaPermissionStatusQueryOptions,
  CuaPermissionRestartOptions,
  CuaPermissionRestartResult,
  ICuaPermissionService,
};