import { AudioWaveform } from "lucide-react";
import { useState } from "react";
import type {
  BaseAssetRecord,
  CompositionResultRecord,
  ImportCompositionInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { BpmCurvePanel } from "../analyzer/components/BpmCurvePanel";
import { CompositionMetricsPanel } from "../analyzer/components/CompositionMetricsPanel";
import { CompositionOverviewPanel } from "../analyzer/components/CompositionOverviewPanel";
import { CompositionRenderPreviewPanel } from "../analyzer/components/CompositionRenderPreviewPanel";
import { CompositionTimelinePanel } from "../analyzer/components/CompositionTimelinePanel";
import { ExportCompositionPanel } from "../analyzer/components/ExportCompositionPanel";
import { WaveformPlaceholder } from "../analyzer/components/WaveformPlaceholder";
import { ImportCompositionForm } from "../library/components/ImportCompositionForm";
import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";

type ComposeTab = "preview" | "structure" | "render" | "export";

interface ComposeScreenProps {
  composition: CompositionResultRecord | null;
  compositions: CompositionResultRecord[];
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  analyzerLabel: string;
  busy: boolean;
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
  onSelectComposition: (id: string) => void;
  onGoLibrary: () => void;
}

export function ComposeScreen({
  composition,
  compositions,
  baseAssets,
  tracks,
  repositories,
  analyzerLabel,
  busy,
  onImportComposition,
  onSelectComposition,
  onGoLibrary,
}: ComposeScreenProps) {
  const t = useT();
  const monitor = useMonitor();
  const [tab, setTab] = useState<ComposeTab>("preview");
  const [currentTime, setCurrentTime] = useState(0);

  const canCompose = baseAssets.length > 0 && (tracks.length > 0 || repositories.length > 0);

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{t.compose.title}</p>
          <h2>{composition ? composition.title : t.compose.title}</h2>
          <p className="support-copy">{t.compose.copy}</p>
        </div>
        {compositions.length > 0 && (
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Compositions</span>
              <strong>{compositions.length}</strong>
            </div>
            {composition && (
              <>
                <div className="summary-pill">
                  <span>Target BPM</span>
                  <strong>{composition.targetBpm.toFixed(0)}</strong>
                </div>
                <div className="summary-pill">
                  <span>Reference</span>
                  <strong>{composition.referenceTitle}</strong>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <div className="compose-layout">
        {/* Left: creation form */}
        <section className="panel compose-form-panel">
          {!canCompose ? (
            <div className="empty-state">
              <AudioWaveform size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p>You need at least one base asset and one track or log to compose.</p>
              <button type="button" className="action" onClick={onGoLibrary}>
                Go to Library →
              </button>
            </div>
          ) : (
            <ImportCompositionForm
              busy={busy}
              baseAssets={baseAssets}
              tracks={tracks}
              repositories={repositories}
              onImportComposition={onImportComposition}
            />
          )}
        </section>

        {/* Right: composition browser + detail */}
        <div className="compose-detail-panel">
          {compositions.length > 0 && (
            <div className="compose-picker-bar">
              <select
                value={composition?.id ?? ""}
                onChange={(e) => onSelectComposition(e.target.value)}
                className="context-select"
              >
                {compositions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} · {c.targetBpm.toFixed(0)} BPM · {formatShortDate(c.importedAt)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!composition ? (
            <section className="panel empty-state">
              <p>Create a composition to see its preview and export options here.</p>
            </section>
          ) : (
            <>
              {tab === "preview" && (
                <div className="analyzer-deck">
                  <WaveformPlaceholder
                    bins={composition.waveformBins}
                    beatGrid={composition.beatGrid}
                    durationSeconds={
                      typeof composition.metrics.previewDurationSeconds === "number"
                        ? composition.metrics.previewDurationSeconds
                        : null
                    }
                    hotCues={composition.visualization?.hotCues}
                    currentTime={currentTime}
                    hero
                    onSeek={monitor.seekGuideTrack}
                    analysisProgress={monitor.playbackProgress}
                  />
                </div>
              )}

              <div className="composition-tabs">
                {(["preview", "structure", "render", "export"] as ComposeTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`composition-tab${tab === t ? " active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className="analyzer-layout">
                <div className="analyzer-main-stack">
                  {tab === "preview" && (
                    <BpmCurvePanel
                      bpmCurve={composition.bpmCurve}
                      fallbackBpm={composition.targetBpm}
                      durationSeconds={
                        typeof composition.metrics.previewDurationSeconds === "number"
                          ? composition.metrics.previewDurationSeconds
                          : null
                      }
                    />
                  )}
                  {tab === "structure" && (
                    <>
                      <CompositionTimelinePanel composition={composition} />
                      <CompositionOverviewPanel composition={composition} />
                    </>
                  )}
                  {tab === "render" && (
                    <CompositionRenderPreviewPanel
                      composition={composition}
                      onTimeUpdate={setCurrentTime}
                    />
                  )}
                  {tab === "export" && (
                    <ExportCompositionPanel composition={composition} />
                  )}
                </div>

                <div className="analyzer-sidebar">
                  <CompositionMetricsPanel
                    composition={composition}
                    analyzerLabel={analyzerLabel}
                  />
                  <section className="panel metric-panel">
                    <details className="panel-collapsible">
                      <summary className="panel-collapsible-summary">Notes &amp; metadata</summary>
                      <div className="panel-collapsible-body">
                        {composition.notes.length > 0 && (
                          <ul className="stack-list note-list">
                            {composition.notes.map((note) => <li key={note}>{note}</li>)}
                          </ul>
                        )}
                        <dl className="meta-list compact-meta">
                          <div><dt>Base asset</dt><dd>{composition.baseAssetTitle}</dd></div>
                          <div><dt>Reference</dt><dd>{composition.referenceSourcePath ?? "Manual BPM"}</dd></div>
                          <div><dt>Strategy</dt><dd>{composition.strategy}</dd></div>
                          <div><dt>Plan path</dt><dd>{composition.exportPath ?? "Pending"}</dd></div>
                        </dl>
                      </div>
                    </details>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
