import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/monitor";
import type { ConnectionTestStatus } from "./connectionsViewModel";
import { buildConnectionSessionId } from "./connectionsTailStateRuntime";
import { runConnectionProbeLoop } from "./connectionsRuntime";
import {
  buildConnectionTestPendingState,
  buildConnectionTestResolvedState,
} from "./connectionsTestStateRuntime";

function resolveAsyncErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function testConnectionState(input: {
  connection: LogSourceConnection;
  t: AppTranslations;
  setError: Dispatch<SetStateAction<string | null>>;
  currentStatusById: Record<string, ConnectionTestStatus>;
  currentMessageById: Record<string, string>;
  setTestStatusById: Dispatch<SetStateAction<Record<string, ConnectionTestStatus>>>;
  setTestMessageById: Dispatch<SetStateAction<Record<string, string>>>;
  startLogSourceConnection: (payload: {
    connectionId: string;
    sessionId: string;
    startFromBeginning: boolean;
  }) => Promise<unknown>;
  pollStreamSession: (sessionId: string) => Promise<StreamSessionPollResult>;
  sleep: (ms: number) => Promise<void>;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
}): Promise<void> {
  const sessionId = buildConnectionSessionId("test", input.connection.id);
  input.setError(null);
  const pendingState = buildConnectionTestPendingState({
    t: input.t,
    connectionId: input.connection.id,
    currentStatusById: input.currentStatusById,
    currentMessageById: input.currentMessageById,
  });
  input.setTestStatusById(pendingState.testStatusById);
  input.setTestMessageById(pendingState.testMessageById);

  try {
    await input.startLogSourceConnection({
      connectionId: input.connection.id,
      sessionId,
      startFromBeginning: false,
    });
    const probe = await runConnectionProbeLoop({
      t: input.t,
      connectionKind: input.connection.kind,
      sessionId,
      pollStreamSession: input.pollStreamSession,
      sleep: input.sleep,
    });
    const resolvedState = buildConnectionTestResolvedState({
      connectionId: input.connection.id,
      status: probe.status,
      message: probe.message,
      currentStatusById: pendingState.testStatusById,
      currentMessageById: pendingState.testMessageById,
    });
    input.setTestStatusById(resolvedState.testStatusById);
    input.setTestMessageById(resolvedState.testMessageById);
  } catch (error) {
    const resolvedState = buildConnectionTestResolvedState({
      connectionId: input.connection.id,
      status: "error",
      message: resolveAsyncErrorMessage(error),
      currentStatusById: pendingState.testStatusById,
      currentMessageById: pendingState.testMessageById,
    });
    input.setTestStatusById(resolvedState.testStatusById);
    input.setTestMessageById(resolvedState.testMessageById);
  } finally {
    try {
      await input.stopStreamSession(sessionId);
    } catch {
      // best-effort cleanup for ephemeral test sessions
    }
  }
}
