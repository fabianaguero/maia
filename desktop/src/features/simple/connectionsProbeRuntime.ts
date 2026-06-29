import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnectionKind, StreamSessionPollResult } from "../../types/monitor";
import {
  filterObservableConnectionLines,
  findCloudProbeError,
  hasCloudReadyMarker,
} from "./connectionProbeMarkers";

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
  const errorMessage = findCloudProbeError(observedLines) ?? null;
  let summary = result.summary || currentSummary;

  if (errorMessage) {
    return {
      sawData,
      sawReady,
      errorMessage: errorMessage ?? t.simpleMode.connections.adapterStartupError,
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
      ? t.simpleMode.connections.linesObservedFromCloud.replace("{count}", String(result.lineCount))
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
