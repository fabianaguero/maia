import type { AppTranslations } from "../../i18n/en";
import type { Dispatch, SetStateAction } from "react";
import type {
  LogSourceConnection,
  LogSourceConnectionKind,
  StreamSessionPollResult,
} from "../../types/monitor";
import type {
  ConnectionDraft,
  ConnectionKind,
  ConnectionTestStatus,
} from "./connectionsViewModel";
import {
  filterObservableConnectionLines,
  findCloudProbeError,
  hasCloudReadyMarker,
} from "./connectionProbeMarkers";

export function buildConnectionSessionId(
  prefix: "conn" | "test",
  connectionId: string,
  now = Date.now(),
): string {
  return `${prefix}-${connectionId}-${now}`;
}

export function appendConnectionTailPreview(
  current: string[],
  nextLines: string[],
  limit = 12,
): string[] {
  if (nextLines.length === 0) {
    return current;
  }

  return [...current, ...nextLines].slice(-limit);
}

export interface ConnectionTailPollViewState {
  tailStatus: string;
  tailPreview: string[];
}

export interface ConnectionTailStartPlan {
  nextSessionId: string;
  openingStatus: string;
  connectedStatus: string;
  clearedPreview: string[];
  activeConnectionId: string;
}

export interface ConnectionTailStopState {
  activeSessionId: null;
  activeConnectionId: null;
  tailStatus: null;
}

export interface ConnectionsHeroStat {
  key: string;
  label: string;
  value: number;
}

export interface ConnectionsScreenViewModel {
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  heroStats: ConnectionsHeroStat[];
  refreshTitle: string;
}

export interface ConnectionsScreenHookState {
  screenViewModel: ConnectionsScreenViewModel;
  connectionKindLabel: Record<ConnectionKind, string>;
  connections: LogSourceConnection[];
  editingConnectionId: string | null;
  draft: ConnectionDraft;
  loading: boolean;
  saving: boolean;
  pickerBusy: boolean;
  error: string | null;
  activeSessionId: string | null;
  activeConnectionId: string | null;
  tailPreview: string[];
  tailStatus: string | null;
  testStatusById: Record<string, ConnectionTestStatus>;
  testMessageById: Record<string, string>;
  setDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  refreshConnections: () => Promise<void>;
  resetForm: () => void;
  loadConnectionIntoForm: (connection: LogSourceConnection) => void;
  handleBrowseFile: () => Promise<void>;
  handleSaveConnection: () => Promise<void>;
  handleStartTail: (connection: LogSourceConnection) => Promise<void>;
  handleStopTail: () => Promise<void>;
  handleDeleteConnection: (id: string) => Promise<void>;
  handleTestConnection: (connection: LogSourceConnection) => Promise<void>;
}

export function buildConnectionsScreenViewModel(input: {
  t: AppTranslations;
  connections: LogSourceConnection[];
}): ConnectionsScreenViewModel {
  const activeCount = input.connections.filter((connection) => connection.enabled).length;

  return {
    heroKicker: input.t.simpleMode.connections.persistentAdapters,
    heroTitle: input.t.simpleMode.connections.title,
    heroDescription: input.t.simpleMode.connections.description,
    heroStats: [
      {
        key: "total",
        label: input.t.simpleMode.connections.total,
        value: input.connections.length,
      },
      {
        key: "active",
        label: input.t.simpleMode.connections.active,
        value: activeCount,
      },
    ],
    refreshTitle: input.t.simpleMode.connections.refreshConnections,
  };
}

export function buildConnectionsScreenHookState(
  input: ConnectionsScreenHookState,
): ConnectionsScreenHookState {
  return {
    screenViewModel: input.screenViewModel,
    connectionKindLabel: input.connectionKindLabel,
    connections: input.connections,
    editingConnectionId: input.editingConnectionId,
    draft: input.draft,
    loading: input.loading,
    saving: input.saving,
    pickerBusy: input.pickerBusy,
    error: input.error,
    activeSessionId: input.activeSessionId,
    activeConnectionId: input.activeConnectionId,
    tailPreview: input.tailPreview,
    tailStatus: input.tailStatus,
    testStatusById: input.testStatusById,
    testMessageById: input.testMessageById,
    setDraft: input.setDraft,
    refreshConnections: input.refreshConnections,
    resetForm: input.resetForm,
    loadConnectionIntoForm: input.loadConnectionIntoForm,
    handleBrowseFile: input.handleBrowseFile,
    handleSaveConnection: input.handleSaveConnection,
    handleStartTail: input.handleStartTail,
    handleStopTail: input.handleStopTail,
    handleDeleteConnection: input.handleDeleteConnection,
    handleTestConnection: input.handleTestConnection,
  };
}

export function formatConnectionTailStatus(
  t: AppTranslations,
  result: Pick<StreamSessionPollResult, "hasData" | "lineCount" | "anomalyCount" | "dominantLevel" | "summary">,
): string {
  return result.hasData
    ? t.simpleMode.connections.testSummary
        .replace("{lines}", String(result.lineCount))
        .replace("{anomalies}", String(result.anomalyCount))
        .replace("{level}", result.dominantLevel)
    : result.summary;
}

export function buildConnectionTailPollViewState(input: {
  t: AppTranslations;
  currentPreview: string[];
  result: StreamSessionPollResult;
}): ConnectionTailPollViewState {
  return {
    tailStatus: formatConnectionTailStatus(input.t, input.result),
    tailPreview:
      input.result.parsedLines.length > 0
        ? appendConnectionTailPreview(input.currentPreview, input.result.parsedLines)
        : input.currentPreview,
  };
}

export function buildConnectionTailStartPlan(input: {
  t: AppTranslations;
  connectionId: string;
  buildSessionId?: (prefix: "conn" | "test", connectionId: string) => string;
}): ConnectionTailStartPlan {
  const buildSessionId = input.buildSessionId ?? buildConnectionSessionId;
  return {
    nextSessionId: buildSessionId("conn", input.connectionId),
    openingStatus: input.t.simpleMode.connections.openingLiveTail,
    connectedStatus: input.t.simpleMode.connections.waitingCloudEntries,
    clearedPreview: [],
    activeConnectionId: input.connectionId,
  };
}

export function buildConnectionTailStopState(): ConnectionTailStopState {
  return {
    activeSessionId: null,
    activeConnectionId: null,
    tailStatus: null,
  };
}

export interface ConnectionProbeStepResult {
  sawData: boolean;
  sawReady: boolean;
  errorMessage: string | null;
  summary: string;
  done: boolean;
}

export function evaluateConnectionProbeStep(input: {
  t: AppTranslations;
  connectionKind: LogSourceConnectionKind;
  result: StreamSessionPollResult;
  currentSummary: string;
}): ConnectionProbeStepResult {
  const { t, connectionKind, result, currentSummary } = input;
  const observedLines = filterObservableConnectionLines(result);
  const sawData = observedLines.length > 0;
  const sawReady = hasCloudReadyMarker(observedLines);
  const errorMessage =
    findCloudProbeError(observedLines) ?? null;
  let summary = result.summary || currentSummary;

  if (errorMessage) {
    return {
      sawData,
      sawReady,
      errorMessage:
        errorMessage ?? t.simpleMode.connections.adapterStartupError,
      summary,
      done: true,
    };
  }

  if (connectionKind === "file_log" && result.warnings.length === 0) {
    if (result.hasData) {
      summary = t.simpleMode.connections.linesAvailableFromTail.replace(
        "{count}",
        String(result.lineCount),
      );
    } else if (!result.summary) {
      summary = t.simpleMode.connections.fileTailOpenedWaiting;
    }

    return {
      sawData,
      sawReady,
      errorMessage: null,
      summary,
      done: true,
    };
  }

  if (connectionKind === "gcp_cloud_run" && (sawReady || result.hasData)) {
    summary = result.hasData
      ? t.simpleMode.connections.linesObservedFromCloud.replace(
          "{count}",
          String(result.lineCount),
        )
      : summary || t.simpleMode.connections.cloudTailOpenedWaiting;

    return {
      sawData,
      sawReady,
      errorMessage: null,
      summary,
      done: true,
    };
  }

  return {
    sawData,
    sawReady,
    errorMessage: null,
    summary,
    done: false,
  };
}

export function resolveConnectionProbeSuccessMessage(input: {
  t: AppTranslations;
  connectionKind: LogSourceConnectionKind;
  latestSummary: string;
  sawData: boolean;
  sawReady: boolean;
}): string {
  const { t, connectionKind, latestSummary, sawData, sawReady } = input;

  if (connectionKind === "file_log") {
    return latestSummary || t.simpleMode.connections.fileTailOpenedCorrectly;
  }

  return sawData || sawReady
    ? latestSummary || t.simpleMode.connections.cloudTailOpenedCorrectly
    : t.simpleMode.connections.connectionOpenedWaitingLogs;
}

export interface ConnectionProbeOutcome {
  status: "success" | "error";
  message: string;
}

export interface ConnectionTestViewState {
  testStatusById: Record<string, "idle" | "testing" | "success" | "error">;
  testMessageById: Record<string, string>;
}

export function buildConnectionTestPendingState(input: {
  t: AppTranslations;
  connectionId: string;
  currentStatusById: Record<string, "idle" | "testing" | "success" | "error">;
  currentMessageById: Record<string, string>;
}): ConnectionTestViewState {
  return {
    testStatusById: {
      ...input.currentStatusById,
      [input.connectionId]: "testing",
    },
    testMessageById: {
      ...input.currentMessageById,
      [input.connectionId]: input.t.simpleMode.connections.openingAdapter,
    },
  };
}

export function buildConnectionTestResolvedState(input: {
  connectionId: string;
  status: "success" | "error";
  message: string;
  currentStatusById: Record<string, "idle" | "testing" | "success" | "error">;
  currentMessageById: Record<string, string>;
}): ConnectionTestViewState {
  return {
    testStatusById: {
      ...input.currentStatusById,
      [input.connectionId]: input.status,
    },
    testMessageById: {
      ...input.currentMessageById,
      [input.connectionId]: input.message,
    },
  };
}

export interface ConnectionTailFailureState {
  activeSessionId: null;
  activeConnectionId: null;
  error: string;
}

export function buildConnectionTailFailureState(error: string): ConnectionTailFailureState {
  return {
    activeSessionId: null,
    activeConnectionId: null,
    error,
  };
}

export async function runConnectionProbeLoop(input: {
  t: AppTranslations;
  connectionKind: LogSourceConnectionKind;
  sessionId: string;
  pollStreamSession: (sessionId: string) => Promise<StreamSessionPollResult>;
  sleep: (ms: number) => Promise<void>;
  attemptCount?: number;
  initialSummary?: string;
}): Promise<ConnectionProbeOutcome> {
  const attempts = input.attemptCount ?? 4;
  let sawData = false;
  let sawReady = false;
  let latestSummary = input.initialSummary ?? input.t.simpleMode.connections.connectionOpened;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await input.sleep(attempt === 0 ? 250 : 600);
    const result = await input.pollStreamSession(input.sessionId);
    const step = evaluateConnectionProbeStep({
      t: input.t,
      connectionKind: input.connectionKind,
      result,
      currentSummary: latestSummary,
    });
    latestSummary = step.summary;
    sawData = sawData || step.sawData;
    sawReady = sawReady || step.sawReady;

    if (step.errorMessage) {
      return {
        status: "error",
        message: step.errorMessage,
      };
    }

    if (step.done) {
      break;
    }
  }

  return {
    status: "success",
    message: resolveConnectionProbeSuccessMessage({
      t: input.t,
      connectionKind: input.connectionKind,
      latestSummary,
      sawData,
      sawReady,
    }),
  };
}
