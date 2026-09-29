/* Synthesized for scriptc from frame-contract.d.ts + frame-contract.js.
 * See host-display-contract.ts for the rationale. */
export const OFFICIAL_CUA_FRAME_INTEGRITY_META_KEY: string = "zcode.cua/official-frame-integrity-v1";
export const OFFICIAL_CUA_FRAME_MODEL_CONTENT_PROTECTION: string = "official_cua_frame_v1";
export const OFFICIAL_CUA_IMAGE_INLINE_BASE64_BYTES: number = 200 * 1024;
export function isOfficialCuaImageRefText(_text: string): boolean {
  return false;
}
export function containsOfficialCuaImageRefCredentialText(_text: string): boolean {
  return false;
}
export function containsImageRefAuthority(_text: string): boolean {
  return false;
}
export function parseOfficialCuaImageRef(_text: string): { authority: string } | undefined {
  return undefined;
}
export function readRasterEnvelopeIdentity(_input: unknown): { algorithm: string } | undefined {
  return undefined;
}
export async function preserveOfficialCuaFrameResult<
  T extends { content?: unknown; isError?: boolean },
>(result: T, _options?: unknown): Promise<T> {
  return result;
}
export interface OfficialCuaFrameAttestation {
  kind: string;
}
export function attestOfficialCuaFrameContent(
  _content: unknown,
  _expectedKind?: string,
): OfficialCuaFrameAttestation | undefined {
  return undefined;
}
export interface OfficialCuaFrameContentPair {
  image: any;
  imageRef: any;
  imageRefIndex: number;
  imageIndex: number;
}
export function findOfficialCuaFrameContentPair(
  _content: unknown,
): OfficialCuaFrameContentPair | undefined {
  return undefined;
}