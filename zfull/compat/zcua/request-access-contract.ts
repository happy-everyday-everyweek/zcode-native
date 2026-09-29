/* Synthesized for scriptc from the zcode-cua package's shipped pair:
 * request-access-contract.d.ts (contract) + request-access-contract.js (stub
 * implementation). See host-display-contract.ts for the rationale. */
export const CUA_REQUEST_ACCESS_STATUS_META_KEY: string = "zcode.cua/request-access-status-v1";

export interface CuaRequestAccessStatus {
  schemaVersion: 1;
  platform: "darwin";
  grantOwner: string;
  accessibility: "granted" | "stale" | "denied";
  screenRecording: "unknown" | "granted" | "denied";
}

export interface CuaRequestAccessStatusSchema {
  safeParse(
    input: unknown,
  ): { success: true; data: CuaRequestAccessStatus } | { success: false; error: Error };
}

export const cuaRequestAccessStatusSchema: CuaRequestAccessStatusSchema = {
  safeParse(_input) {
    return {
      success: false,
      error: new Error("Computer Use is not available in this build."),
    };
  },
};