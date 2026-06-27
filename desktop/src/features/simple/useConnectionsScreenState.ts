import { useEffect, useRef, useState } from "react";

import {
  deleteLogSourceConnection,
  listLogSourceConnections,
  pickRepositoryFile,
  pollStreamSession,
  startLogSourceConnection,
  stopStreamSession,
  upsertLogSourceConnection,
} from "../../api/repositories";
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/monitor";
import type { AppTranslations } from "../../i18n/en";
import {
  buildConnectionKindLabelMap,
  createConnectionDraftFromConnection,
  createEmptyConnectionDraft,
  type ConnectionDraft,
  type ConnectionKind,
  type ConnectionTestStatus,
} from "./connectionsViewModel";
import {
  buildConnectionsScreenHookState,
  buildConnectionTailPollViewState,
  buildConnectionTailFailureState,
  buildConnectionTailStartPlan,
  buildConnectionTailStopState,
  buildConnectionsScreenViewModel,
} from "./connectionsRuntime";
import {
  browseConnectionFileState,
  deleteConnectionState,
  refreshConnectionsState,
  saveConnectionState,
  testConnectionState,
} from "./connectionsScreenStateRuntime";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function useConnectionsScreenState(input: {
  t: AppTranslations;
  defaultCloudLookback: string;
}) {
  const [connections, setConnections] = useState<LogSourceConnection[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ConnectionDraft>(() =>
    createEmptyConnectionDraft(input.defaultCloudLookback),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [tailPreview, setTailPreview] = useState<string[]>([]);
  const [tailStatus, setTailStatus] = useState<string | null>(null);
  const [testStatusById, setTestStatusById] = useState<Record<string, ConnectionTestStatus>>({});
  const [testMessageById, setTestMessageById] = useState<Record<string, string>>({});
  const pollTimerRef = useRef<number | null>(null);
  const testStatusByIdRef = useRef<Record<string, ConnectionTestStatus>>({});
  const testMessageByIdRef = useRef<Record<string, string>>({});

  const screenViewModel = buildConnectionsScreenViewModel({
    t: input.t,
    connections,
  });
  const connectionKindLabel: Record<ConnectionKind, string> = {
    ...buildConnectionKindLabelMap(input.t),
  };

  async function refreshConnections() {
    await refreshConnectionsState({
      setLoading,
      setError,
      setConnections,
      listLogSourceConnections,
    });
  }

  useEffect(() => {
    void refreshConnections();
    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    testStatusByIdRef.current = testStatusById;
  }, [testStatusById]);

  useEffect(() => {
    testMessageByIdRef.current = testMessageById;
  }, [testMessageById]);

  function resetForm() {
    setEditingConnectionId(null);
    setDraft(createEmptyConnectionDraft(input.defaultCloudLookback));
  }

  function loadConnectionIntoForm(connection: LogSourceConnection) {
    setEditingConnectionId(connection.id);
    setDraft(createConnectionDraftFromConnection(connection));
    setError(null);
  }

  async function handleBrowseFile() {
    await browseConnectionFileState({
      sourcePath: draft.sourcePath,
      setPickerBusy,
      setError,
      setDraft,
      pickRepositoryFile,
      fallbackErrorMessage: input.t.simpleMode.connections.nativeFilePickerFailed,
    });
  }

  async function handleSaveConnection() {
    await saveConnectionState({
      draft,
      editingConnectionId,
      t: input.t,
      setSaving,
      setError,
      upsertLogSourceConnection,
      onAfterSave: async () => {
        resetForm();
        await refreshConnections();
      },
    });
  }

  function scheduleConnectionPoll(sessionId: string) {
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const result: StreamSessionPollResult = await pollStreamSession(sessionId);
        setTailPreview((current) => {
          const nextState = buildConnectionTailPollViewState({
            t: input.t,
            currentPreview: current,
            result,
          });
          setTailStatus(nextState.tailStatus);
          return nextState.tailPreview;
        });
        scheduleConnectionPoll(sessionId);
      } catch (nextError) {
        const nextState = buildConnectionTailFailureState(
          nextError instanceof Error ? nextError.message : String(nextError),
        );
        setError(nextState.error);
        setActiveSessionId(nextState.activeSessionId);
        setActiveConnectionId(nextState.activeConnectionId);
      }
    }, 1500);
  }

  async function handleStartTail(connection: LogSourceConnection) {
    try {
      const startPlan = buildConnectionTailStartPlan({
        t: input.t,
        connectionId: connection.id,
      });
      setError(null);
      setTailPreview(startPlan.clearedPreview);
      setTailStatus(startPlan.openingStatus);
      if (activeSessionId) {
        await stopStreamSession(activeSessionId);
      }
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
      const sessionId = startPlan.nextSessionId;
      await startLogSourceConnection({
        connectionId: connection.id,
        sessionId,
        startFromBeginning: false,
      });
      setActiveSessionId(sessionId);
      setActiveConnectionId(startPlan.activeConnectionId);
      setTailStatus(startPlan.connectedStatus);
      scheduleConnectionPoll(sessionId);
    } catch (nextError) {
      const nextState = buildConnectionTailFailureState(
        nextError instanceof Error ? nextError.message : String(nextError),
      );
      setError(nextState.error);
      setActiveSessionId(nextState.activeSessionId);
      setActiveConnectionId(nextState.activeConnectionId);
    }
  }

  async function handleStopTail() {
    const sessionId = activeSessionId;
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    const nextState = buildConnectionTailStopState();
    setActiveSessionId(nextState.activeSessionId);
    setActiveConnectionId(nextState.activeConnectionId);
    setTailStatus(nextState.tailStatus);
    if (sessionId) {
      await stopStreamSession(sessionId);
    }
  }

  async function handleDeleteConnection(id: string) {
    await deleteConnectionState({
      id,
      editingConnectionId,
      setError,
      deleteLogSourceConnection,
      resetForm,
      refreshConnections,
    });
  }

  async function handleTestConnection(connection: LogSourceConnection) {
    await testConnectionState({
      connection,
      t: input.t,
      setError,
      currentStatusById: testStatusByIdRef.current,
      currentMessageById: testMessageByIdRef.current,
      setTestStatusById,
      setTestMessageById,
      startLogSourceConnection,
      pollStreamSession,
      sleep,
      stopStreamSession,
    });
  }

  return buildConnectionsScreenHookState({
    screenViewModel,
    connectionKindLabel,
    connections,
    editingConnectionId,
    draft,
    loading,
    saving,
    pickerBusy,
    error,
    activeSessionId,
    activeConnectionId,
    tailPreview,
    tailStatus,
    testStatusById,
    testMessageById,
    setDraft,
    refreshConnections,
    resetForm,
    loadConnectionIntoForm,
    handleBrowseFile,
    handleSaveConnection,
    handleStartTail,
    handleStopTail,
    handleDeleteConnection,
    handleTestConnection,
  });
}
