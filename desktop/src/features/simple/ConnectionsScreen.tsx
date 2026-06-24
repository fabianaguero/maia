import {
  Cable,
  FolderOpen,
  Globe,
  Pencil,
  Play,
  RefreshCw,
  ScrollText,
  Square,
  Trash2,
  X,
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
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/library";

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
  "command not found",
  "not recognized as an internal or external command",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isCloudSdkNoise(line: string): boolean {
  return (
    line.includes("SyntaxWarning") &&
    (line.includes("google-cloud-sdk") || line.includes("gcloud"))
  );
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

function readConfigString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const value = config[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function deriveCloudBackfillLabel(connection: LogSourceConnection): string | null {
  if (connection.kind !== "gcp_cloud_run") return null;
  const configured = readConfigString(connection.config, "backfillFreshness");
  if (!configured) return "Lookback 10m";
  if (configured === "0" || configured.toLowerCase() === "off") {
    return "Lookback live-only";
  }
  return `Lookback ${configured}`;
}

export function ConnectionsScreen() {
  const [connections, setConnections] = useState<LogSourceConnection[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [kind, setKind] = useState<ConnectionKind>("file_log");
  const [label, setLabel] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [gcpProjectId, setGcpProjectId] = useState("");
  const [gcpServiceName, setGcpServiceName] = useState("");
  const [gcpRegion, setGcpRegion] = useState("");
  const [gcpBackfillFreshness, setGcpBackfillFreshness] = useState("10m");
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

  function resetForm() {
    setEditingConnectionId(null);
    setKind("file_log");
    setLabel("");
    setSourcePath("");
    setGcpProjectId("");
    setGcpServiceName("");
    setGcpRegion("");
    setGcpBackfillFreshness("10m");
  }

  function loadConnectionIntoForm(connection: LogSourceConnection) {
    setEditingConnectionId(connection.id);
    setKind(connection.kind as ConnectionKind);
    setLabel(connection.label);
    setSourcePath(readConfigString(connection.config, "path") ?? connection.sourceUri);
    setGcpProjectId(readConfigString(connection.config, "projectId") ?? "");
    setGcpServiceName(readConfigString(connection.config, "serviceName") ?? "");
    setGcpRegion(readConfigString(connection.config, "region") ?? "");
    setGcpBackfillFreshness(
      readConfigString(connection.config, "backfillFreshness") ?? "10m",
    );
    setError(null);
  }

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
          id: editingConnectionId ?? undefined,
          kind: "file_log",
          label: label.trim() || deriveFileConnectionLabel(normalizedPath),
          sourceUri: normalizedPath,
          config: {
            path: normalizedPath,
          },
        });
      } else {
        const projectId = gcpProjectId.trim();
        const serviceName = gcpServiceName.trim();
        const region = gcpRegion.trim();
        const backfillFreshness = gcpBackfillFreshness.trim() || "10m";
        if (!projectId || !serviceName) {
          setError("GCP Cloud Run requiere project ID y service name.");
          return;
        }

        await upsertLogSourceConnection({
          id: editingConnectionId ?? undefined,
          kind: "gcp_cloud_run",
          label: label.trim() || `${serviceName} · Cloud Run`,
          sourceUri:
            region
              ? `gcp-cloud-run://${projectId}/${region}/${serviceName}`
              : `gcp-cloud-run://${projectId}/${serviceName}`,
          config: {
            projectId,
            serviceName,
            region: region || undefined,
            minimumSeverity: "DEFAULT",
            backfillFreshness,
          },
        });
      }

      resetForm();
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
        const result: StreamSessionPollResult = await pollStreamSession(sessionId);
        setTailStatus(
          result.hasData
            ? `${result.lineCount} lines · ${result.anomalyCount} anomalies · ${result.dominantLevel}`
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
      setError(
        nextError instanceof Error ? nextError.message : String(nextError),
      );
    }
  }

  async function handleTestConnection(connection: LogSourceConnection) {
    const sessionId = `test-${connection.id}-${Date.now()}`;
    setError(null);
    setTestStatusById((current) => ({ ...current, [connection.id]: "testing" }));
    setTestMessageById((current) => ({ ...current, [connection.id]: "Opening adapter…" }));

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
      let latestSummary = "Connection opened.";

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await sleep(attempt === 0 ? 250 : 600);
        const result = await pollStreamSession(sessionId);
        latestSummary = result.summary || latestSummary;
        const observedLines = [...result.warnings, ...result.parsedLines]
          .filter((line) => !isCloudSdkNoise(line));

        if (observedLines.length > 0) {
          sawData = true;
        }
        if (hasAnyMarker(observedLines, GCLOUD_READY_MARKERS)) {
          sawReady = true;
        }
        if (hasAnyMarker(observedLines, GCLOUD_ERROR_MARKERS)) {
          sawError = true;
          errorMessage =
            observedLines.find((line) =>
              GCLOUD_ERROR_MARKERS.some((marker) => line.includes(marker)),
            ) ?? "The adapter reported an error during startup.";
          break;
        }

        if (connection.kind === "file_log" && result.warnings.length === 0) {
          sawReady = true;
          if (result.hasData) {
            latestSummary = `${result.lineCount} lines available from tail`;
          } else if (result.summary) {
            latestSummary = result.summary;
          } else {
            latestSummary = "File tail opened. Waiting for new lines.";
          }
          break;
        }

        if (connection.kind === "gcp_cloud_run" && (sawReady || result.hasData)) {
          latestSummary = result.hasData
            ? `${result.lineCount} lines observed from Cloud Logging`
            : latestSummary || "Cloud Run tail opened. Waiting for entries.";
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
          ? latestSummary || "File tail opened correctly."
          : sawData || sawReady
            ? latestSummary || "Cloud Run tail opened correctly."
            : "Connection opened. Waiting for new log lines.";

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
            <h3>{editingConnectionId ? "Editar conexión" : "Nueva conexión"}</h3>
            <p className="support-copy">
              {editingConnectionId
                ? "Ajustá la conexión guardada y actualizala sin recrearla."
                : "Elegí el adapter persistente que querés dejar disponible en el monitor."}
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
                <label className="field maia-field">
                  <span className="field-label">Stream lookback</span>
                  <input
                    value={gcpBackfillFreshness}
                    className="maia-input"
                    onChange={(event) => setGcpBackfillFreshness(event.target.value)}
                    placeholder="10m"
                  />
                  <span className="support-copy">
                    Cuánto histórico traer al abrir el stream. Usá `30m`, `2h`,
                    `1d` o `off` para sólo tiempo real.
                  </span>
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
              {saving
                ? " Saving..."
                : editingConnectionId
                  ? " Update connection"
                  : " Save connection"}
            </button>
            {editingConnectionId ? (
              <button
                type="button"
                className="card-action-btn"
                disabled={saving}
                onClick={() => resetForm()}
              >
                <X size={14} />
                Cancel
              </button>
            ) : null}
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
                <li
                  key={connection.id}
                  className={`asset-card ${editingConnectionId === connection.id ? "selected" : ""}`}
                  onClick={() => loadConnectionIntoForm(connection)}
                >
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
                      {activeConnectionId === connection.id ? " · Tailing now" : ""}
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
                    {deriveCloudBackfillLabel(connection) ? (
                      <span className="asset-card-date">
                        {deriveCloudBackfillLabel(connection)}
                      </span>
                    ) : null}
                  </div>
                  <div className="asset-card-actions">
                    {activeConnectionId === connection.id ? (
                      <button
                        type="button"
                        className="card-action-delete"
                        title="Stop live tail"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleStopTail();
                        }}
                      >
                        <Square size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="card-action-delete"
                        title="Start live tail"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleStartTail(connection);
                        }}
                        disabled={activeSessionId !== null}
                      >
                        <Play size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="card-action-btn"
                      title="Edit connection"
                      onClick={(event) => {
                        event.stopPropagation();
                        loadConnectionIntoForm(connection);
                      }}
                      disabled={saving}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="card-action-btn"
                      title="Test persistent connection"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleTestConnection(connection);
                      }}
                      disabled={
                        activeSessionId !== null ||
                        testStatusById[connection.id] === "testing"
                      }
                    >
                      Test
                    </button>
                    <button
                      type="button"
                      className="card-action-delete"
                      title="Delete connection"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteConnection(connection.id);
                      }}
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
