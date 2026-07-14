import type { MonitorLogLine } from "./monitorLogParsing";
import { useSourceCodeLines } from "../../hooks/useSourceCodeLines";

interface AnomalyDetailsPanelProps {
  selectedLine: MonitorLogLine | null;
  isExpanded: boolean;
  onToggle: () => void;
}

export function AnomalyDetailsPanel({
  selectedLine,
  isExpanded,
  onToggle,
}: AnomalyDetailsPanelProps) {
  const sourceFile = selectedLine?.sonarQubeMeta?.component ?? null;
  const sourceLine = selectedLine?.sonarQubeMeta?.line ?? null;
  const { lines: codeLines, loading: codeLoading, error: codeError } = useSourceCodeLines(
    sourceFile,
    sourceLine,
  );

  return (
    <>
      {/* Drawer Panel */}
      <div className={`anomaly-details-panel ${isExpanded ? "expanded" : ""}`}>
        <div className="anomaly-details-header">
          <h3>Detalles de Anomalía</h3>
          <button className="close-btn" onClick={onToggle}>✕</button>
        </div>

        {selectedLine && (
          <div className="anomaly-details-content">
            <div className="detail-section">
              <label>ID</label>
              <code>{selectedLine.id}</code>
            </div>

            <div className="detail-section">
              <label>Timestamp</label>
              <code>{selectedLine.timestamp}</code>
            </div>

            <div className="detail-section">
              <label>Nivel</label>
              <span className={`level-badge level-${selectedLine.level}`}>{selectedLine.level}</span>
            </div>

            <div className="detail-section">
              <label>Mensaje</label>
              <p className="detail-message">{selectedLine.message}</p>
            </div>

            {selectedLine.sonarQubeMeta && (
              <>
                <div className="detail-divider" />
                <div className="detail-section">
                  <label>SonarQube Rule</label>
                  <code>{selectedLine.sonarQubeMeta.rule}</code>
                </div>

                <div className="detail-section">
                  <label>Componente</label>
                  <code>{selectedLine.sonarQubeMeta.component}</code>
                </div>

                {selectedLine.sonarQubeMeta.line && (
                  <div className="detail-section">
                    <label>Línea</label>
                    <code>{selectedLine.sonarQubeMeta.line}</code>
                  </div>
                )}

                <div className="detail-section">
                  <label>Severidad</label>
                  <code>{selectedLine.sonarQubeMeta.sonarSeverity}</code>
                </div>
              </>
            )}

            {codeLines.length > 0 && (
              <>
                <div className="detail-divider" />
                <div className="detail-section" style={{ gridColumn: "1 / -1" }}>
                  <label>Código Fuente</label>
                  <div className="source-code-block">
                    {codeLoading && <span className="code-loading">Cargando...</span>}
                    {codeError && <span className="code-error">Error: {codeError}</span>}
                    {codeLines.map((line, idx) => (
                      <code key={idx} className={line.startsWith("▶") ? "highlighted-line" : ""}>
                        {line}
                      </code>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="detail-actions">
              <button
                className="btn-copy"
                onClick={() => {
                  const text = `${selectedLine.timestamp} [${selectedLine.level}] ${selectedLine.message}`;
                  navigator.clipboard.writeText(text);
                }}
              >
                📋 Copiar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
