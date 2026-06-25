import { AudioWaveform } from "lucide-react";
import { useState } from "react";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
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
  playlists: BaseTrackPlaylist[];
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
  playlists,
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

  const canCompose = baseAssets.length > 0 && (tracks.length > 0 || playlists.length > 0);

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
              <span>{t.compose.compositions}</span>
              <strong>{compositions.length}</strong>
            </div>
            {composition && (
              <>
                <div className="summary-pill">
                  <span>{t.compose.targetBpm}</span>
                  <strong>{composition.targetBpm.toFixed(0)}</strong>
                </div>
                <div className="summary-pill">
                  <span>{t.compose.timingSource}</span>
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
              <p>{t.compose.emptyRequirements}</p>
              <button type="button" className="action" onClick={onGoLibrary}>
                {t.compose.goLibrary}
              </button>
            </div>
          ) : (
            <ImportCompositionForm
              busy={busy}
              baseAssets={baseAssets}
              tracks={tracks}
              playlists={playlists}
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
              <p>{t.compose.createToPreview}</p>
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
                {(["preview", "structure", "render", "export"] as ComposeTab[]).map((tabOption) => (
                  <button
                    key={tabOption}
                    type="button"
                    className={`composition-tab${tab === tabOption ? " active" : ""}`}
                    onClick={() => setTab(tabOption)}
                  >
                    {tabOption === "preview"
                      ? t.compose.previewTab
                      : tabOption === "structure"
                        ? t.compose.structureTab
                        : tabOption === "render"
                          ? t.compose.renderTab
                          : t.compose.exportTab}
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
                  {tab === "export" && <ExportCompositionPanel composition={composition} />}
                </div>

                <div className="analyzer-sidebar">
                  <CompositionMetricsPanel
                    composition={composition}
                    analyzerLabel={analyzerLabel}
                  />
                  <section className="panel metric-panel">
                    <details className="panel-collapsible">
                      <summary className="panel-collapsible-summary">
                        {t.compose.notesMetadata}
                      </summary>
                      <div className="panel-collapsible-body">
                        {composition.notes.length > 0 && (
                          <ul className="stack-list note-list">
                            {composition.notes.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                          </ul>
                        )}
                        <dl className="meta-list compact-meta">
                          <div>
                            <dt>{t.compose.baseAsset}</dt>
                            <dd>{composition.baseAssetTitle}</dd>
                          </div>
                          {composition.basePlaylistName ? (
                            <div>
                              <dt>{t.compose.basePlaylist}</dt>
                              <dd>{composition.basePlaylistName}</dd>
                            </div>
                          ) : null}
                          <div>
                            <dt>{t.compose.timingSource}</dt>
                            <dd>{composition.referenceSourcePath ?? composition.referenceTitle}</dd>
                          </div>
                          <div>
                            <dt>{t.compose.strategy}</dt>
                            <dd>{composition.strategy}</dd>
                          </div>
                          <div>
                            <dt>{t.compose.planPath}</dt>
                            <dd>{composition.exportPath ?? t.inspect.pending}</dd>
                          </div>
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
