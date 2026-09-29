/* Type-façade for @zcode/tui. The real implementation is a React-style
 * terminal UI whose .tsx sources sit outside scriptc's supported surface
 * (scriptc's checker does not enable JSX). Per project scope (UI 不编译),
 * the implementation is excluded from the compile graph; this façade keeps
 * the exact public type surface so dependents (cli, ...) still typecheck
 * against identical types. Runtime loading of the real tui stays with the
 * dynamic-import path in cli (tui-runtime-loader). */
import type { TuiOptions } from "@zcode/tui/types.js";
export type {
  TuiClipboardImage,
  TuiImageMediaType,
  TuiListMcpServers,
  TuiGetMainSessionId,
  TuiListWorkflowRuns,
  TuiReplayWorkflowRuns,
  TuiListWorkspacePathSuggestions,
  TuiEffortOption,
  TuiModelOption,
  TuiOptions,
  TuiPromptAttachment,
  TuiPromptInput,
  TuiRecallPreviousInput,
  TuiReadClipboardImage,
  TuiReadSubagents,
  TuiReadSubagentTranscript,
  TuiSubagentTranscriptSnapshot,
  TuiRequestPermission,
  TuiSelection,
  TuiSelectionItem,
  TuiSessionMetadata,
  TuiStartupOptions,
  TuiSetMode,
  TuiSetModeResult,
  TuiSendInput,
  TuiSendInputResult,
  TuiSlashCommandSuggestion,
  TuiSubmitPrompt,
  TuiSubmitPromptResult,
  TuiSubscribeSessionEvents,
  TuiWorkflowRunSummary,
  TuiSwitchableMode,
  TuiWorkspacePathKind,
  TuiWorkspacePathSuggestion,
  TuiWorkspacePathSuggestionResult,
  TuiWriteClipboardText,
} from "@zcode/tui/types.js";
export declare function runTui(options: TuiOptions): Promise<number>;
