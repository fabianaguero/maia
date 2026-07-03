import type { AppTranslations } from "../../i18n/types";
import type { StreamSessionPollResult } from "../../types/monitor";

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

export interface ConnectionTailFailureState {
  activeSessionId: null;
  activeConnectionId: null;
  error: string;
}

export function formatConnectionTailStatus(
  t: AppTranslations,
  result: Pick<
    StreamSessionPollResult,
    "hasData" | "lineCount" | "anomalyCount" | "dominantLevel" | "summary"
  >,
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

export function buildConnectionTailFailureState(error: string): ConnectionTailFailureState {
  return {
    activeSessionId: null,
    activeConnectionId: null,
    error,
  };
}
