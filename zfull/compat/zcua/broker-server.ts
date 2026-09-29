/* Synthesized for scriptc from broker-server.d.ts + broker-server.js.
 * See host-display-contract.ts for the rationale. */
import { CuaHelperError } from "@zcode/zcode-cua/broker";
import type {
  CuaPermissionRestartOptions,
  CuaPermissionRestartResult,
  HelperHealth,
} from "@zcode/zcode-cua/broker";

export const HELPER_ADDON_ENV: string = "ZCODE_CUA_HELPER_ADDON";
export const WINDOWS_DEV_CONTROL_PROTOCOL: string = "zcode-cua-windows-dev/v1";
const UNAVAILABLE = "Computer Use is not available in this build.";

function unavailableReject(): Promise<never> {
  return Promise.reject(new CuaHelperError(UNAVAILABLE));
}

export interface HelperLaunchSpec {
  [key: string]: unknown;
}
export function buildHelperOpenArgs(_spec: HelperLaunchSpec, _launcherPid?: number): string[] {
  return [];
}
export function isCuaLocalDevelopmentRuntime(
  _env?: NodeJS.ProcessEnv,
  _compiledLocalDevelopmentRuntime?: boolean,
): boolean {
  return false;
}
export interface HelperPermissionSubjectIdentity {
  appPath: string;
  executablePath: string;
  displayName: string;
  bundleId: string;
  [key: string]: unknown;
}
export async function resolveHelperPermissionSubjectIdentity(
  _appPath: string,
): Promise<HelperPermissionSubjectIdentity> {
  throw new CuaHelperError(UNAVAILABLE);
}
export interface CuaHelperVerifierDependencies {
  readExecutableArchs: (executablePath: string) => Promise<string[]>;
  [key: string]: unknown;
}
export interface CuaHelperInstallerOptions {
  env?: NodeJS.ProcessEnv;
  logger?: unknown;
  bundledAppPath?: string;
  plan?: unknown;
  dependencies?: Partial<CuaHelperVerifierDependencies>;
}
export interface CuaHelperInstaller {
  ensureInstalled(): Promise<string>;
  verifyInstalled(appPath: string, options?: unknown): Promise<void>;
}
export function createCuaHelperInstaller(_options?: CuaHelperInstallerOptions): CuaHelperInstaller {
  return {
    ensureInstalled: unavailableReject,
    verifyInstalled: unavailableReject,
  };
}
export const defaultCuaHelperVerifierDependencies: CuaHelperVerifierDependencies = {
  readExecutableArchs: unavailableReject,
  verifyCodeSignature: unavailableReject,
  verifyTeamIdentifier: unavailableReject,
};
export function cuaBrokerRefreshMarkerPath(_socketPath: string): string | undefined {
  return undefined;
}
export interface CuaBrokerRefreshMarkerHandle {
  path: string;
}
export async function publishCuaBrokerRefreshMarker(
  _socketPath: string,
  _options?: { deadlineMs?: number; now?: () => number },
): Promise<CuaBrokerRefreshMarkerHandle> {
  return { path: undefined as unknown as string };
}
export interface HelperNativeAddon {
  [key: string]: unknown;
}
export function loadRealNativeAddon(_options?: unknown): HelperNativeAddon {
  throw new CuaHelperError(UNAVAILABLE);
}
export function resolvePackagedNativeAddonPath(_options?: unknown): string | undefined {
  return undefined;
}
export function resolveInTreeAddonPath(_options?: unknown): string | undefined {
  return undefined;
}
export interface AxReadOnlySource {
  [key: string]: unknown;
}
export function createAxReadOnlyMethods(
  _source: AxReadOnlySource,
  _registry?: unknown,
  _options?: unknown,
): Record<string, unknown> {
  return {};
}
export const ROLE_TO_KIND: Readonly<Record<string, string>> = {};
export function roleToKind(_role: string): string | undefined {
  return undefined;
}
export class CuaHelperLifecycleManager<Managed> {
  #dispose: ((managed: Managed) => Promise<void> | void) | undefined;
  #current: Managed | undefined;
  #disposed = false;
  constructor(dispose?: (managed: Managed) => Promise<void> | void) {
    this.#dispose = dispose;
    this.#current = undefined;
  }
  async acquire(options: {
    isAdmitted?: () => boolean;
    shouldRetainCurrent?: (current: Managed) => boolean;
    create: () => Managed | undefined;
  }): Promise<Managed | undefined> {
    if (typeof options?.isAdmitted === "function" && !options.isAdmitted()) {
      return undefined;
    }
    const managed = options?.create?.();
    this.#current = managed;
    return managed;
  }
  peek(): Managed | undefined {
    return this.#current;
  }
  get disposed(): boolean {
    return this.#disposed;
  }
  async dispose(managed?: Managed): Promise<void> {
    this.#disposed = true;
    await this.#dispose?.((managed ?? this.#current) as Managed);
  }
}
export interface CuaProductMcpServerResolverContext {
  workspacePath?: string;
  workspaceIdentity?: string;
  [key: string]: unknown;
}
export class CuaProductHelperWorkspaceRegistry {
  setEnabled(
    _context: CuaProductMcpServerResolverContext | undefined,
    _enabled: boolean,
  ): void {}
}
export interface CuaHelperTransportHandle {
  socketPath: string;
  pluginAuthority: string;
  [key: string]: unknown;
}
export interface CuaPermissionStatusQueryReport {
  grant_owner: string | null;
  owner?: { display_name?: string | null } | null;
  accessibility: "granted" | "stale" | "denied" | "unknown";
  accessibility_probe?: { ok: boolean; classification?: string };
  screen_recording: "granted" | "denied" | "unknown";
  screen_capture_probe?: { ok: boolean; classification?: string };
  [key: string]: unknown;
}
export interface CuaProductHelperHost {
  readonly running: boolean;
  readonly socketPath: string | null;
  readonly pluginAuthority: string | null;
  start(): Promise<CuaHelperHandle>;
  stop(): Promise<void>;
  restart(): Promise<CuaHelperHandle>;
  restartAfterCurrentStart(): Promise<CuaHelperHandle>;
  restartAfterCurrentStartPreservingTransport?(
    restartOptions?: CuaHelperTransportRestartOptions,
  ): Promise<CuaHelperTransportRestartResult>;
  waitForTransport?(timeoutMs?: number): Promise<CuaHelperTransportHandle>;
  checkHealth(timeoutMs?: number): Promise<HelperHealth>;
}
export type ManagedCuaProductHelperHost = CuaProductHelperHost;
export interface CuaHelperHost extends CuaProductHelperHost {
  readonly reservedTransport: CuaHelperTransportHandle | undefined;
  waitForTransport(timeoutMs?: number): Promise<CuaHelperTransportHandle>;
  queryScreenCaptureProbe(): Promise<{ ok: boolean; reason?: string }>;
  queryScreenRecordingPreflight(): Promise<"granted" | "denied" | "unknown" | undefined>;
  queryPermissionStatus(): Promise<CuaPermissionStatusQueryReport>;
}
export interface CuaHelperTransportRestartOptions {
  beforeFreshStart?: () => void;
  [key: string]: unknown;
}
export interface CuaHelperTransportRestartResult {
  handle: CuaHelperHandle;
  reused: boolean;
}
export interface CuaHelperHandle {
  socketPath: string;
  launchSocketPath?: string;
  pluginAuthority: string;
  helperAppPath?: string;
  bundleId?: string | null;
  pid?: number | null;
  [key: string]: unknown;
}
export interface CuaProductMcpServerConfigLike {
  [key: string]: unknown;
}
export interface CuaProductMcpServerResolver {
  resolveMcpServers<T>(
    servers: T[] | undefined,
    context?: CuaProductMcpServerResolverContext,
  ): Promise<T[] | undefined>;
  restart(): Promise<void>;
  restartAfterPermissionGrant(onboardingSessionId?: string): Promise<void>;
}
export interface CreateProductCuaHelperHostOptions {
  logger?: unknown;
  env?: NodeJS.ProcessEnv;
  helperInstaller?: CuaHelperInstaller;
  bundledHelperAppPath?: string;
  healthTimeoutMs?: number;
  [key: string]: unknown;
}
function createUnavailableCuaHelperHost(): CuaHelperHost {
  return {
    get running() {
      return false;
    },
    get socketPath() {
      return null;
    },
    get pluginAuthority() {
      return null;
    },
    get reservedTransport() {
      return undefined;
    },
    start: unavailableReject,
    stop: async () => {},
    restart: unavailableReject,
    restartAfterCurrentStart: unavailableReject,
    waitForTransport: unavailableReject,
    checkHealth: unavailableReject,
    queryScreenCaptureProbe: async () => ({
      ok: false,
      reason: UNAVAILABLE,
    }),
    queryScreenRecordingPreflight: async () => undefined,
    queryPermissionStatus: async () => ({} as CuaPermissionStatusQueryReport),
  };
}
export function createProductCuaHelperHost(
  _options?: CreateProductCuaHelperHostOptions,
): CuaHelperHost {
  return createUnavailableCuaHelperHost();
}
export function isOfficialCuaPluginEnabledForWorkspace(
  _options?: IsOfficialCuaPluginEnabledForWorkspaceOptions,
): boolean {
  return false;
}
export function createCuaProductMcpServerResolver(
  _host: CuaProductHelperHost,
  _options?: { hasActiveTurn?: () => boolean },
): CuaProductMcpServerResolver {
  return {
    async resolveMcpServers(servers, _context) {
      return servers;
    },
    async restart() {
      throw new Error(UNAVAILABLE);
    },
    async restartAfterPermissionGrant(_onboardingSessionId) {
      throw new Error(UNAVAILABLE);
    },
  };
}
export async function waitForCuaHelperStartup<T>(
  startup: Promise<T>,
  _deadlineMs?: number,
): Promise<T> {
  return await startup;
}
export function isPotentialZCodeCuaAgentMcpServer(_server: unknown): boolean {
  return false;
}
export interface CuaScreenCaptureProbeResult {
  ok: boolean;
  reason?: string;
}
export function isScreenCaptureProbeSuccess(
  _probe: CuaScreenCaptureProbeResult | undefined,
): boolean {
  return false;
}
export function markCuaProductHelperAgentEnvUnavailable(
  _host: Pick<CuaHelperHost, "start">,
): void {}
export function hasCuaProductHelperAgentEnvUnavailable(
  _host: Pick<CuaHelperHost, "start">,
): boolean {
  return false;
}
export function clearCuaProductHelperAgentEnvUnavailable(
  _host: Pick<CuaHelperHost, "start">,
): void {}
export async function reapOrphanedHelpers(_options: {
  logger?: unknown;
  env?: NodeJS.ProcessEnv;
}): Promise<void> {}
export interface HelperPermissionRequestResult {
  ok: boolean;
  reason?: string;
}
export async function requestHelperAccessibilityPermissionViaLaunchServices(
  _options?: unknown,
): Promise<HelperPermissionRequestResult> {
  return { ok: false, reason: UNAVAILABLE };
}
export async function requestHelperScreenRecordingPermissionViaLaunchServices(
  _options?: unknown,
): Promise<HelperPermissionRequestResult> {
  return { ok: false, reason: UNAVAILABLE };
}
export interface IsOfficialCuaPluginEnabledForWorkspaceOptions {
  env?: NodeJS.ProcessEnv;
  workingDirectory?: string;
  [key: string]: unknown;
}
export type { CuaPermissionRestartOptions, CuaPermissionRestartResult };