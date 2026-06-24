import {
  Cable,
  FolderOpen,
  Globe,
  Play,
  RefreshCw,
  ScrollText,
  Square,
  Trash2,
} from "lucide-react";
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
import type {
  LogSourceConnection,
  StreamSessionPollResult,
} from "../../types/library";

type ConnectionKind = "file_log" | "gcp_cloud_run";
type ConnectionTestStatus = "idle" | "testing" | "success" | "error";

const CONNECTION_KIND_LABEL: Record<ConnectionKind, string> = {
  file_log: "File tail",
  gcp_cloud_run: "GCP Cloud Run",
};

const GCLOUD_READY_MARKERS = [
  "Initializing tail session",
  "Waiting for new log lines",
];
const GCLOUD_ERROR_MARKERS = [
  "ERROR:",
  "You do not currently have an active account",
  "Permission denied",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isCloudSdkNoise(line: string): boolean {
  return line.includes("SyntaxWarning") && line.includes("google-cloud-sdk");
}

function hasAnyMarker(lines: string[], markers: string[]): boolean {
  return lines.some((line) => markers.some((marker) => line.includes(marker)));
}

function deriveFileConnectionLabel(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "log-file";
  const parts = trimmed.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? trimmed;
}

export function ConnectionsScreen() {
  const [connections, setConnections] = useState<LogSourceConnection[]>([]);
  const [kind, setKind] = useState<ConnectionKind>("file_log");
  const [label, setLabel] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [gcpProjectId, setGcpProjectId] = useState("");
  const [gcpServiceName, setGcpServiceName] = useState("");
  const [gcpRegion, setGcpRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(
    null,
  );
  const [tailPreview, setTailPreview] = useState<string[]>([]);
  const [tailStatus, setTailStatus] = useState<string | null>(null);
  const [testStatusById, setTestStatusById] = useState<
    Record<string, ConnectionTestStatus>
  >({});
  const [testMessageById, setTestMessageById] = useState<
    Record<string, string>
  >({});
  const pollTimerRef = useRef<number | null>(null);

  const activeCount = useMemo(
    () => connections.filter((connection) => connection.enabled).length,
    [connections],
  );

  async function refreshConnections() {
    try {
      setLoading(true);
      setError(null);
      setConnections(await listLogSourceConnections());
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : String(nextError),
      );
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

  async function handleBrowseFile() {
    try {
      setPickerBusy(true);
      setError(null);
      const pickedPath = await pickRepositoryFile(sourcePath);
      if (pickedPath) {
        setSourcePath(pickedPath);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Native file picker failed. Enter the path manually.",
      );
    } finally {
      setPickerBusy(false);
    }
  }

  async function handleSaveConnection() {
    try {
      setSaving(true);
      setError(null);

      if (kind === "file_log") {
        const normalizedPath = sourcePath.trim();
        if (!normalizedPath) {
          setError(
            "Elegí un archivo de log para crear la conexión persistente.",
          );
          return;
        }

        await upsertLogSourceConnection({
          kind: "file_log",
          label: label.trim() || deriveFileConnectionLabel(normalizedPath),
          sourceUri: normalizedPath,
          config: {
            path: normalizedPath,
          },
        });
        setLabel("");
        setSourcePath("");
      } else {
        const projectId = gcpProjectId.trim();
        const serviceName = gcpServiceName.trim();
        const region = gcpRegion.trim();
        if (!projectId || !serviceName) {
          setError("GCP Cloud Run requiere project ID y service name.");
          return;
        }

        await upsertLogSourceConnection({
          kind: "gcp_cloud_run",
          label: label.trim() || `${serviceName} · Cloud Run`,
          config: {
            projectId,
            serviceName,
            region: region || undefined,
            minimumSeverity: "DEFAULT",
          },
        });
        setLabel("");
        setGcpProjectId("");
        setGcpServiceName("");
        setGcpRegion("");
      }

      await refreshConnections();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : String(nextError),
      );
    } finally {
      setSaving(false);
    }
  }

  function scheduleConnectionPoll(sessionId: string) {
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const result: StreamSessionPollResult =
          await pollStreamSession(sessionId);
        const visibleLines = result.parsedLines.filter(
          (line) => !isCloudSdkNoise(line),
        );
        const gcloudReady = hasAnyMarker(visibleLines, GCLOUD_READY_MARKERS);
        setTailStatus(
          gcloudReady
            ? "Connected to gcloud tail session. Waiting for Cloud Logging entries…"
            : result.hasData
              ? `${result.lineCount} lines · ${result.anomalyCount} anomalies · ${result.dominantLevel}`
              : result.summary,
        );
        if (visibleLines.length > 0) {
          setTailPreview((current) => [...current, ...visibleLines].slice(-12));
        }
        scheduleConnectionPoll(sessionId);
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : String(nextError),
        );
        setActiveSessionId(null);
        setActiveConnectionId(null);
      }
    }, 1500);
  }

  async function handleStartTail(connection: LogSourceConnection) {
    try {
      setError(null);
      setTailPreview([]);
      setTailStatus("Opening live tail…");
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
      setTailStatus("Connected. Waiting for Cloud Logging entries…");
      scheduleConnectionPoll(sessionId);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : String(nextError),
      );
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

  async function handleTestConnection(connection: LogSourceConnection) {
    const sessionId = `test-${connection.id}-${Date.now()}`;
    setError(null);
    setTestStatusById((current) => ({
      ...current,
      [connection.id]: "testing",
    }));
    setTestMessageById((current) => ({
      ...current,
      [connection.id]: "Testing gcloud tail startup…",
    }));

    try {
      await startLogSourceConnection({
        connectionId: connection.id,
        sessionId,
        startFromBeginning: false,
      });

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await sleep(1000);
        const result = await pollStreamSession(sessionId);
        const visibleLines = result.parsedLines.filter(
          (line) => !isCloudSdkNoise(line),
        );
        if (hasAnyMarker(visibleLines, GCLOUD_ERROR_MARKERS)) {
          throw new Error(
            visibleLines.find((line) =>
              hasAnyMarker([line], GCLOUD_ERROR_MARKERS),
            ) ?? "gcloud tail failed",
          );
        }
        if (
          result.hasData ||
          hasAnyMarker(visibleLines, GCLOUD_READY_MARKERS)
        ) {
          setTestStatusById((current) => ({
            ...current,
            [connection.id]: "success",
          }));
          setTestMessageById((current) => ({
            ...current,
            [connection.id]: "OK: gcloud tail session initialized.",
          }));
          return;
        }
      }

      setTestStatusById((current) => ({
        ...current,
        [connection.id]: "success",
      }));
      setTestMessageById((current) => ({
        ...current,
        [connection.id]: "OK: process started; no log lines yet.",
      }));
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : String(nextError);
      setTestStatusById((current) => ({
        ...current,
        [connection.id]: "error",
      }));
      setTestMessageById((current) => ({
        ...current,
        [connection.id]: message,
      }));
    } finally {
      await stopStreamSession(sessionId);
    }
  }

  async function handleDeleteConnection(id: string) {
    try {
      setError(null);
      await deleteLogSourceConnection(id);
      await refreshConnections();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : String(nextError),
      );
    }
  }

  return (
    <section className="connections-screen">
      <div className="connections-hero panel">
        <div className="connections-hero__copy">
          <span className="connections-hero__kicker">Persistent adapters</span>
          <h2>Conexiones</h2>
          <p>
            Configurá fuentes persistentes para monitoreo pasivo. Acá quedan
            guardados los file tails y los conectores de GCP Cloud Run para
            reabrirlos después.
          </p>
        </div>
        <div className="connections-hero__stats">
          <div className="connections-stat">
            <span className="connections-stat__label">TOTAL</span>
            <strong>{connections.length}</strong>
          </div>
          <div className="connections-stat">
            <span className="connections-stat__label">ACTIVE</span>
            <strong>{activeCount}</strong>
          </div>
          <button
            type="button"
            className="control-button"
            onClick={() => void refreshConnections()}
            disabled={loading || saving}
            title="Refresh connections"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="connections-layout">
        <section className="panel connections-panel">
          <div className="form-intro">
            <h3>Nueva conexión</h3>
            <p className="support-copy">
              Elegí el adapter persistente que querés dejar disponible en el
              monitor.
            </p>
          </div>

          <div
            className="source-card-grid"
            role="tablist"
            aria-label="Connection kind"
          >
            <button
              type="button"
              className={`source-card ${kind === "file_log" ? "active" : ""}`}
              onClick={() => setKind("file_log")}
            >
              <div className="source-card-icon">
                <ScrollText size={24} />
              </div>
              <div className="source-card-content">
                <strong>File log</strong>
                <p>Tail persistente sobre un archivo local.</p>
              </div>
            </button>
            <button
              type="button"
              className={`source-card ${kind === "gcp_cloud_run" ? "active" : ""}`}
              onClick={() => setKind("gcp_cloud_run")}
            >
              <div className="source-card-icon">
                <Globe size={24} />
              </div>
              <div className="source-card-content">
                <strong>GCP Cloud Run</strong>
                <p>Conector persistente sobre `gcloud logging tail`.</p>
              </div>
            </button>
          </div>

          <div className="form-fields-section">
            {kind === "file_log" ? (
              <label className="field maia-field">
                <span className="field-label">Log file path</span>
                <div className="field-input-wrapper">
                  <input
                    value={sourcePath}
                    className="maia-input"
                    onChange={(event) => setSourcePath(event.target.value)}
                    placeholder="/var/log/app.log"
                  />
                  <button
                    type="button"
                    className="input-inline-action"
                    disabled={saving || pickerBusy}
                    onClick={() => void handleBrowseFile()}
                  >
                    {pickerBusy ? "..." : <FolderOpen size={16} />}
                  </button>
                </div>
              </label>
            ) : (
              <>
                <label className="field maia-field">
                  <span className="field-label">GCP Project ID</span>
                  <input
                    value={gcpProjectId}
                    className="maia-input"
                    onChange={(event) => setGcpProjectId(event.target.value)}
                    placeholder="my-gcp-project"
                  />
                </label>
                <label className="field maia-field">
                  <span className="field-label">Cloud Run service</span>
                  <input
                    value={gcpServiceName}
                    className="maia-input"
                    onChange={(event) => setGcpServiceName(event.target.value)}
                    placeholder="checkout-api"
                  />
                </label>
                <label className="field maia-field">
                  <span className="field-label">Region (optional)</span>
                  <input
                    value={gcpRegion}
                    className="maia-input"
                    onChange={(event) => setGcpRegion(event.target.value)}
                    placeholder="us-central1"
                  />
                </label>
              </>
            )}

            <label className="field maia-field">
              <span className="field-label">Connection label</span>
              <input
                value={label}
                className="maia-input"
                onChange={(event) => setLabel(event.target.value)}
                placeholder={
                  kind === "file_log"
                    ? "visits-service live tail"
                    : "checkout-api · Cloud Run"
                }
              />
            </label>
          </div>

          {error ? (
            <div className="form-notice error">
              <span>{error}</span>
            </div>
          ) : null}

          <div className="form-actions-footer">
            <button
              type="button"
              className="action primary-launch-btn"
              disabled={saving || loading}
              onClick={() => void handleSaveConnection()}
            >
              <Cable size={16} />
              {saving ? " Saving..." : " Save connection"}
            </button>
          </div>
        </section>

        <section className="panel connections-panel">
          <div className="panel-header compact">
            <div>
              <h3>Saved connections</h3>
              <p className="support-copy">
                Estas conexiones deberían quedar accesibles desde el monitor
                para abrirlas cuando quieras.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="placeholder-loading">
              <span className="spin-ring" aria-hidden="true" />
              Loading…
            </div>
          ) : connections.length === 0 ? (
            <div className="empty-state compact-empty">
              <Cable size={28} />
              <strong>No hay conexiones persistentes todavía</strong>
              <p>
                Agregá un file tail o una conexión de Cloud Run para verla acá.
              </p>
            </div>
          ) : (
            <ul className="asset-card-list">
              {connections.map((connection) => (
                <li key={connection.id} className="asset-card">
                  <div className="asset-card-icon source-icon">
                    <Cable size={18} />
                  </div>
                  <div className="asset-card-body">
                    <strong className="asset-card-title">
                      {connection.label}
                    </strong>
                    <div className="asset-card-meta">
                      <span className="type-badge">
                        {CONNECTION_KIND_LABEL[
                          connection.kind as ConnectionKind
                        ] ?? connection.kind}
                      </span>
                      <span
                        className={
                          connection.enabled ? "bpm-badge" : "bpm-badge pending"
                        }
                      >
                        {connection.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {" · "}
                      {connection.adapterKind}
                      {activeConnectionId === connection.id
                        ? " · Tailing now"
                        : ""}
                    </div>
                    {testStatusById[connection.id] &&
                    testStatusById[connection.id] !== "idle" ? (
                      <div className="asset-card-meta">
                        <span
                          className={
                            testStatusById[connection.id] === "success"
                              ? "bpm-badge"
                              : testStatusById[connection.id] === "error"
                                ? "bpm-badge pending"
                                : "type-badge"
                          }
                        >
                          {testStatusById[connection.id] === "testing"
                            ? "Testing…"
                            : testStatusById[connection.id] === "success"
                              ? "Connection OK"
                              : "Test failed"}
                        </span>
                        <span>{testMessageById[connection.id]}</span>
                      </div>
                    ) : null}
                    <span
                      className="asset-card-date"
                      title={connection.sourceUri}
                    >
                      {connection.sourceUri}
                    </span>
                  </div>
                  <div className="asset-card-actions">
                    <button
                      type="button"
                      className="card-action-delete"
                      title="Test gcloud/file tail connection"
                      onClick={() => void handleTestConnection(connection)}
                      disabled={
                        activeSessionId !== null ||
                        testStatusById[connection.id] === "testing"
                      }
                    >
                      Test
                    </button>
                    {activeConnectionId === connection.id ? (
                      <button
                        type="button"
                        className="card-action-delete"
                        title="Stop live tail"
                        onClick={() => void handleStopTail()}
                      >
                        <Square size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="card-action-delete"
                        title="Start live tail"
                        onClick={() => void handleStartTail(connection)}
                        disabled={activeSessionId !== null}
                      >
                        <Play size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="card-action-delete"
                      title="Delete connection"
                      onClick={() => void handleDeleteConnection(connection.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeSessionId ? (
            <div className="form-notice">
              <strong>Live tail</strong>
              <span>{tailStatus ?? "Connected"}</span>
              {tailPreview.length > 0 ? (
                <pre>{tailPreview.join("\n")}</pre>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
