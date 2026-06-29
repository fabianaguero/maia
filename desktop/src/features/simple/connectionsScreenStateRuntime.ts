import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/en";
import type {
  LogSourceConnection,
  StreamSessionPollResult,
  UpsertLogSourceConnectionInput,
} from "../../types/monitor";
import type { ConnectionDraft, ConnectionTestStatus } from "./connectionsViewModel";
import { buildConnectionUpsertInput } from "./connectionsViewModel";
import {
  buildConnectionSessionId,
  buildConnectionTestPendingState,
  buildConnectionTestResolvedState,
  runConnectionProbeLoop,
} from "./connectionsRuntime";

function resolveAsyncErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function refreshConnectionsState(input: {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setConnections: Dispatch<SetStateAction<LogSourceConnection[]>>;
  listLogSourceConnections: () => Promise<LogSourceConnection[]>;
}): Promise<void> {
  try {
    input.setLoading(true);
    input.setError(null);
    input.setConnections(await input.listLogSourceConnections());
  } catch (error) {
    input.setError(resolveAsyncErrorMessage(error));
  } finally {
    input.setLoading(false);
  }
}

export async function browseConnectionFileState(input: {
  sourcePath: string;
  setPickerBusy: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  pickRepositoryFile: (currentPath?: string) => Promise<string | null>;
  fallbackErrorMessage: string;
}): Promise<void> {
  try {
    input.setPickerBusy(true);
    input.setError(null);
    const pickedPath = await input.pickRepositoryFile(input.sourcePath);
    if (pickedPath) {
      input.setDraft((current) => ({ ...current, sourcePath: pickedPath }));
    }
  } catch (error) {
    input.setError(error instanceof Error ? error.message : input.fallbackErrorMessage);
  } finally {
    input.setPickerBusy(false);
  }
}

export async function saveConnectionState(input: {
  draft: ConnectionDraft;
  editingConnectionId: string | null;
  t: AppTranslations;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  upsertLogSourceConnection: (payload: UpsertLogSourceConnectionInput) => Promise<unknown>;
  onAfterSave: () => Promise<void>;
}): Promise<void> {
  try {
    input.setSaving(true);
    input.setError(null);
    const nextInput = buildConnectionUpsertInput({
      draft: input.draft,
      editingConnectionId: input.editingConnectionId,
      t: input.t,
    });
    if (!nextInput.ok) {
      input.setError(nextInput.error);
      return;
    }

    await input.upsertLogSourceConnection(nextInput.value);
    await input.onAfterSave();
  } catch (error) {
    input.setError(resolveAsyncErrorMessage(error));
  } finally {
    input.setSaving(false);
  }
}

export async function deleteConnectionState(input: {
  id: string;
  editingConnectionId: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  deleteLogSourceConnection: (id: string) => Promise<unknown>;
  resetForm: () => void;
  refreshConnections: () => Promise<void>;
}): Promise<void> {
  try {
    input.setError(null);
    await input.deleteLogSourceConnection(input.id);
    if (input.editingConnectionId === input.id) {
      input.resetForm();
    }
    await input.refreshConnections();
  } catch (error) {
    input.setError(resolveAsyncErrorMessage(error));
  }
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
