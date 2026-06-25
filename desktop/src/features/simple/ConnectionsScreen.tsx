import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  deleteLogSourceConnection,
  listLogSourceConnections,
  pickRepositoryFile,
  pollStreamSession,
  startLogSourceConnection,
  stopStreamSession,
  upsertLogSourceConnection,
} from "../../api/repositories";
import { useT } from "../../i18n/I18nContext";
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/library";
import {
  buildConnectionKindLabelMap,
  buildConnectionUpsertInput,
  createConnectionDraftFromConnection,
  createEmptyConnectionDraft,
  type ConnectionDraft,
  type ConnectionKind,
  type ConnectionTestStatus,
} from "./connectionsViewModel";
import {
  filterObservableConnectionLines,
  findCloudProbeError,
  hasCloudReadyMarker,
} from "./connectionProbeMarkers";
import { ConnectionsFormPanel } from "./ConnectionsFormPanel";
import { ConnectionsSavedListPanel } from "./ConnectionsSavedListPanel";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function ConnectionsScreen() {
  const t = useT();
  const [connections, setConnections] = useState<LogSourceConnection[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ConnectionDraft>(createEmptyConnectionDraft);
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

  const activeCount = useMemo(
    () => connections.filter((connection) => connection.enabled).length,
    [connections],
  );
  const connectionKindLabel: Record<ConnectionKind, string> = {
    ...buildConnectionKindLabelMap(t),
  };

  async function refreshConnections() {
    try {
      setLoading(true);
      setError(null);
      setConnections(await listLogSourceConnections());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshConnections();
    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  function resetForm() {
    setEditingConnectionId(null);
    setDraft(createEmptyConnectionDraft());
  }

  function loadConnectionIntoForm(connection: LogSourceConnection) {
    setEditingConnectionId(connection.id);
    setDraft(createConnectionDraftFromConnection(connection));
    setError(null);
  }

  async function handleBrowseFile() {
    try {
      setPickerBusy(true);
      setError(null);
      const pickedPath = await pickRepositoryFile(draft.sourcePath);
      if (pickedPath) {
        setDraft((current) => ({ ...current, sourcePath: pickedPath }));
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : t.simpleMode.connections.nativeFilePickerFailed,
      );
    } finally {
      setPickerBusy(false);
    }
  }

  async function handleSaveConnection() {
    try {
      setSaving(true);
      setError(null);
      const nextInput = buildConnectionUpsertInput({
        draft,
        editingConnectionId,
        t,
      });
      if (!nextInput.ok) {
        setError(nextInput.error);
        return;
      }

      await upsertLogSourceConnection(nextInput.value);

      resetForm();
      await refreshConnections();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  }

  function scheduleConnectionPoll(sessionId: string) {
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const result: StreamSessionPollResult = await pollStreamSession(sessionId);
        setTailStatus(
          result.hasData
            ? t.simpleMode.connections.testSummary
                .replace("{lines}", String(result.lineCount))
                .replace("{anomalies}", String(result.anomalyCount))
                .replace("{level}", result.dominantLevel)
            : result.summary,
        );
        if (result.parsedLines.length > 0) {
          setTailPreview((current) => [...current, ...result.parsedLines].slice(-12));
        }
        scheduleConnectionPoll(sessionId);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : String(nextError));
        setActiveSessionId(null);
        setActiveConnectionId(null);
      }
    }, 1500);
  }

  async function handleStartTail(connection: LogSourceConnection) {
    try {
      setError(null);
      setTailPreview([]);
      setTailStatus(t.simpleMode.connections.openingLiveTail);
      if (activeSessionId) {
        await stopStreamSession(activeSessionId);
      }
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
      const sessionId = `conn-${connection.id}-${Date.now()}`;
      await startLogSourceConnection({
        connectionId: connection.id,
        sessionId,
        startFromBeginning: false,
      });
      setActiveSessionId(sessionId);
      setActiveConnectionId(connection.id);
      setTailStatus(t.simpleMode.connections.waitingCloudEntries);
      scheduleConnectionPoll(sessionId);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      setActiveSessionId(null);
      setActiveConnectionId(null);
    }
  }

  async function handleStopTail() {
    const sessionId = activeSessionId;
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setActiveSessionId(null);
    setActiveConnectionId(null);
    setTailStatus(null);
    if (sessionId) {
      await stopStreamSession(sessionId);
    }
  }

  async function handleDeleteConnection(id: string) {
    try {
      setError(null);
      await deleteLogSourceConnection(id);
      if (editingConnectionId === id) {
        resetForm();
      }
      await refreshConnections();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  }

  async function handleTestConnection(connection: LogSourceConnection) {
    const sessionId = `test-${connection.id}-${Date.now()}`;
    setError(null);
    setTestStatusById((current) => ({ ...current, [connection.id]: "testing" }));
    setTestMessageById((current) => ({
      ...current,
      [connection.id]: t.simpleMode.connections.openingAdapter,
    }));

    try {
      await startLogSourceConnection({
        connectionId: connection.id,
        sessionId,
        startFromBeginning: false,
      });

      let sawData = false;
      let sawReady = false;
      let sawError = false;
      let errorMessage = "";
      let latestSummary = t.simpleMode.connections.connectionOpened;

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await sleep(attempt === 0 ? 250 : 600);
        const result = await pollStreamSession(sessionId);
        latestSummary = result.summary || latestSummary;
        const observedLines = filterObservableConnectionLines(result);

        if (observedLines.length > 0) {
          sawData = true;
        }
        if (hasCloudReadyMarker(observedLines)) {
          sawReady = true;
        }
        const connectionError = findCloudProbeError(observedLines);
        if (connectionError) {
          sawError = true;
          errorMessage = connectionError ?? t.simpleMode.connections.adapterStartupError;
          break;
        }

        if (connection.kind === "file_log" && result.warnings.length === 0) {
          sawReady = true;
          if (result.hasData) {
            latestSummary = t.simpleMode.connections.linesAvailableFromTail.replace(
              "{count}",
              String(result.lineCount),
            );
          } else if (result.summary) {
            latestSummary = result.summary;
          } else {
            latestSummary = t.simpleMode.connections.fileTailOpenedWaiting;
          }
          break;
        }

        if (connection.kind === "gcp_cloud_run" && (sawReady || result.hasData)) {
          latestSummary = result.hasData
            ? t.simpleMode.connections.linesObservedFromCloud.replace(
                "{count}",
                String(result.lineCount),
              )
            : latestSummary || t.simpleMode.connections.cloudTailOpenedWaiting;
          break;
        }
      }

      if (sawError) {
        setTestStatusById((current) => ({ ...current, [connection.id]: "error" }));
        setTestMessageById((current) => ({ ...current, [connection.id]: errorMessage }));
        return;
      }

      const successMessage =
        connection.kind === "file_log"
          ? latestSummary || t.simpleMode.connections.fileTailOpenedCorrectly
          : sawData || sawReady
            ? latestSummary || t.simpleMode.connections.cloudTailOpenedCorrectly
            : t.simpleMode.connections.connectionOpenedWaitingLogs;

      setTestStatusById((current) => ({ ...current, [connection.id]: "success" }));
      setTestMessageById((current) => ({ ...current, [connection.id]: successMessage }));
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : String(nextError);
      setTestStatusById((current) => ({ ...current, [connection.id]: "error" }));
      setTestMessageById((current) => ({ ...current, [connection.id]: message }));
    } finally {
      try {
        await stopStreamSession(sessionId);
      } catch {
        // best-effort cleanup for ephemeral test sessions
      }
    }
  }

  return (
    <section className="connections-screen">
      <div className="connections-hero panel">
        <div className="connections-hero__copy">
          <span className="connections-hero__kicker">
            {t.simpleMode.connections.persistentAdapters}
          </span>
          <h2>{t.simpleMode.connections.title}</h2>
          <p>{t.simpleMode.connections.description}</p>
        </div>
        <div className="connections-hero__stats">
          <div className="connections-stat">
            <span className="connections-stat__label">{t.simpleMode.connections.total}</span>
            <strong>{connections.length}</strong>
          </div>
          <div className="connections-stat">
            <span className="connections-stat__label">{t.simpleMode.connections.active}</span>
            <strong>{activeCount}</strong>
          </div>
          <button
            type="button"
            className="control-button"
            onClick={() => void refreshConnections()}
            disabled={loading || saving}
            title={t.simpleMode.connections.refreshConnections}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="connections-layout">
        <ConnectionsFormPanel
          editingConnectionId={editingConnectionId}
          draft={draft}
          saving={saving}
          loading={loading}
          pickerBusy={pickerBusy}
          error={error}
          onKindChange={(nextKind) => setDraft((current) => ({ ...current, kind: nextKind }))}
          onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          onBrowseFile={handleBrowseFile}
          onSaveConnection={handleSaveConnection}
          onCancelEdit={resetForm}
        />

        <ConnectionsSavedListPanel
          loading={loading}
          connections={connections}
          editingConnectionId={editingConnectionId}
          connectionKindLabel={connectionKindLabel}
          activeConnectionId={activeConnectionId}
          activeSessionId={activeSessionId}
          saving={saving}
          testStatusById={testStatusById}
          testMessageById={testMessageById}
          tailStatus={tailStatus}
          tailPreview={tailPreview}
          onRefreshConnections={refreshConnections}
          onSelectConnection={loadConnectionIntoForm}
          onStartTail={handleStartTail}
          onStopTail={handleStopTail}
          onEditConnection={loadConnectionIntoForm}
          onTestConnection={handleTestConnection}
          onDeleteConnection={handleDeleteConnection}
        />
      </div>
    </section>
  );
}
