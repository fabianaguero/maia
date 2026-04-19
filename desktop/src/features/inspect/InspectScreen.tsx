import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  AnalyzerViewMode,
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { BaseAssetMetricsPanel } from "../analyzer/components/BaseAssetMetricsPanel";
import { BaseAssetOverviewPanel } from "../analyzer/components/BaseAssetOverviewPanel";
import { BeatGridEditorPanel } from "../analyzer/components/BeatGridEditorPanel";
import { BpmCurvePanel } from "../analyzer/components/BpmCurvePanel";
import { BpmPanel } from "../analyzer/components/BpmPanel";
import { LiveLogMonitorPanel } from "../analyzer/components/LiveLogMonitorPanel";
import { LogSignalPanel } from "../analyzer/components/LogSignalPanel";
import { RepositoryMetricsPanel } from "../analyzer/components/RepositoryMetricsPanel";
import { RepositoryOverviewPanel } from "../analyzer/components/RepositoryOverviewPanel";
import { RepoStatusPanel } from "../analyzer/components/RepoStatusPanel";
import { SongMetadataPanel } from "../analyzer/components/SongMetadataPanel";
import { TrackPerformancePanel } from "../analyzer/components/TrackPerformancePanel";
import { TrackPlaybackPanel } from "../analyzer/components/TrackPlaybackPanel";
import { TrackOriginalComparePanel } from "../analyzer/components/TrackOriginalComparePanel";
import { WaveformPlaceholder } from "../analyzer/components/WaveformPlaceholder";
import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";
import {
  createAnchoredBeatGridUpdate,
  isEditableBpm,
  type BeatGridPhraseRange,
} from "../../utils/beatGrid";
import {
  resolveTrackPlacementSecond,
  moveTrackSavedLoop,
  setTrackCuePointSecond,
  setTrackSavedLoopBoundary,
  getTrackSourcePath,
  getTrackStoragePath,
  getTrackTitle,
  getTrackWaveformRegions,
  getTrackWaveformCues,
  hasUsableBeatGrid,
  type TrackCompareAuditionPoint,
} from "../../utils/track";
import type { ManagedAudioCueRequest } from "../analyzer/components/ManagedAudioPlayer";

function formatAnalysisMode(analysisMode: string): string {
  return analysisMode
    .split("-")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");
}

interface InspectScreenProps {
  track: LibraryTrack | null;
  repository: RepositoryAnalysis | null;
  baseAsset: BaseAssetRecord | null;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  availableRepositories: RepositoryAnalysis[];
  availableBaseAssets: BaseAssetRecord[];
  mode: AnalyzerViewMode;
  analyzerLabel: string;
  onChangeMode: (mode: AnalyzerViewMode) => void;
  onSelectTrack: (id: string) => void;
  onSelectRepository: (id: string) => void;
  onSelectBaseAsset: (id: string) => void;
  onGoLibrary: () => void;
  onGoCompose: () => void;
  onUpdateTrackPerformance: (
    trackId: string,
    input: UpdateTrackPerformanceInput,
  ) => Promise<void>;
  onUpdateTrackAnalysis: (
    trackId: string,
    input: UpdateTrackAnalysisInput,
  ) => Promise<void>;
  trackMutating: boolean;
}

export function InspectScreen({
  track,
  repository,
  baseAsset,
  availableTracks,
  availablePlaylists,
  availableRepositories,
  availableBaseAssets,
  mode,
  analyzerLabel,
  onChangeMode,
  onSelectTrack,
  onSelectRepository,
  onSelectBaseAsset,
  onGoLibrary,
  onGoCompose,
  onUpdateTrackPerformance,
  onUpdateTrackAnalysis,
  trackMutating,
}: InspectScreenProps) {
  const t = useT();
  const monitor = useMonitor();
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPhraseRange, setSelectedPhraseRange] =
    useState<BeatGridPhraseRange | null>(null);
  const [compareCueRequest, setCompareCueRequest] =
    useState<ManagedAudioCueRequest | null>(null);
  const [activeCompareAuditionId, setActiveCompareAuditionId] =
    useState<TrackCompareAuditionPoint["id"] | null>(null);
  const [activeCompareAuditionLabel, setActiveCompareAuditionLabel] =
    useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "grid" | "performance" | "metadata">("overview");

  useEffect(() => {
    setSelectedPhraseRange(null);
    setCompareCueRequest(null);
    setActiveCompareAuditionId(null);
    setActiveCompareAuditionLabel(null);
  }, [
    track?.id,
    track?.analysis.beatGrid.length,
    track?.analysis.beatGrid[0]?.second,
    track?.analysis.durationSeconds,
  ]);

  const hasAnyAsset =
    availableTracks.length > 0 ||
    availableRepositories.length > 0 ||
    availableBaseAssets.length > 0;

  const contextBar = (
    <div className="analyzer-context-bar">
      <div className="analyzer-mode-tabs">
        {availableTracks.length > 0 && (
          <button
            type="button"
            className={mode === "track" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("track")}
          >
            Tracks
            <span className="mode-tab-count">{availableTracks.length}</span>
          </button>
        )}
        {availableRepositories.length > 0 && (
          <button
            type="button"
            className={mode === "repo" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("repo")}
          >
            Logs / Repos
            <span className="mode-tab-count">{availableRepositories.length}</span>
          </button>
        )}
        {availableBaseAssets.length > 0 && (
          <button
            type="button"
            className={mode === "base" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("base")}
          >
            Base assets
            <span className="mode-tab-count">{availableBaseAssets.length}</span>
          </button>
        )}
      </div>

      <div className="analyzer-asset-picker">
        {mode === "track" && availableTracks.length > 0 && (
          <select
            value={track?.id ?? ""}
            onChange={(e) => onSelectTrack(e.target.value)}
            className="context-select"
          >
            {availableTracks.map((t) => (
              <option key={t.id} value={t.id}>{getTrackTitle(t)}</option>
            ))}
          </select>
        )}
        {mode === "repo" && availableRepositories.length > 0 && (
          <select
            value={repository?.id ?? ""}
            onChange={(e) => onSelectRepository(e.target.value)}
            className="context-select"
          >
            {availableRepositories.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        )}
        {mode === "base" && availableBaseAssets.length > 0 && (
          <select
            value={baseAsset?.id ?? ""}
            onChange={(e) => onSelectBaseAsset(e.target.value)}
            className="context-select"
          >
            {availableBaseAssets.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  if (!hasAnyAsset) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>Nothing to inspect yet</h2>
            <p className="support-copy">{t.inspect.copy}</p>
          </div>
        </header>
        <section className="panel empty-state large">
          <Activity size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Import a track, log, or base asset first.</p>
          <button type="button" className="action" onClick={onGoLibrary}>
            Go to Library →
          </button>
        </section>
      </section>
    );
  }

  // ── TRACK ──────────────────────────────────────────────────────────────────
  if (mode === "track") {
    if (!track) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div><p className="eyebrow">{t.inspect.title}</p><h2>No track selected</h2></div>
          </header>
          {contextBar}
        </section>
      );
    }

    const editableTrackBpm = isEditableBpm(track.analysis.bpm)
      ? track.analysis.bpm
      : null;
    const waveformEditableCues = [
      ...(track.performance.mainCueSecond !== null
        ? [
            {
              id: "main-cue",
              second: track.performance.mainCueSecond,
              label: "Main",
              kind: "main" as const,
              color: track.performance.color,
            },
          ]
        : []),
      ...track.performance.hotCues.map((cue) => ({
        id: cue.id,
        second: cue.second,
        label: cue.label,
        kind: cue.kind,
        color: cue.color,
      })),
      ...track.performance.memoryCues.map((cue) => ({
        id: cue.id,
        second: cue.second,
        label: cue.label,
        kind: cue.kind,
        color: cue.color,
      })),
    ];
    const quantizeWaveformEdits = hasUsableBeatGrid(track.analysis.beatGrid);

    const handleMoveWaveformCue = (
      cue: {
        id: string;
        second: number;
        label: string;
        kind: "main" | "hot" | "memory";
      },
      second: number,
    ) => {
      if (cue.kind === "main") {
        return void onUpdateTrackPerformance(track.id, {
          mainCueSecond: resolveTrackPlacementSecond(
            second,
            track.analysis.durationSeconds,
            track.analysis.beatGrid,
            quantizeWaveformEdits,
          ),
        });
      }

      const cueCollection =
        cue.kind === "hot"
          ? track.performance.hotCues
          : track.performance.memoryCues;
      const nextCues = setTrackCuePointSecond(cueCollection, cue.id, second, {
        durationSeconds: track.analysis.durationSeconds,
        beatGrid: track.analysis.beatGrid,
        quantizeEnabled: quantizeWaveformEdits,
      });

      return void onUpdateTrackPerformance(track.id, {
        [cue.kind === "hot" ? "hotCues" : "memoryCues"]: nextCues,
      });
    };

    const handleCompareAudition = (point: TrackCompareAuditionPoint) => {
      setCurrentTime(point.second);
      monitor.seekGuideTrack(point.second);
      setActiveCompareAuditionId(point.id);
      setActiveCompareAuditionLabel(point.label);
      setCompareCueRequest((previous) => ({
        id: (previous?.id ?? 0) + 1,
        second: point.second,
        autoplay: true,
      }));
    };

    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{track.tags.title}</h2>
            <p className="support-copy">{t.inspect.copy}</p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Status</span>
              <strong>{track.analysis.analyzerStatus}</strong>
            </div>
            <div className="summary-pill">
              <span>Style</span>
              <strong>{track.tags.musicStyleLabel}</strong>
            </div>
            <div className="summary-pill">
              <span>Imported</span>
              <strong>{formatShortDate(track.analysis.importedAt)}</strong>
            </div>
          </div>
        </header>
        {contextBar}

        <div className="analyzer-deck">
          <WaveformPlaceholder
            bins={track.analysis.waveformBins}
            beatGrid={track.analysis.beatGrid}
            durationSeconds={track.analysis.durationSeconds}
            hotCues={getTrackWaveformCues(track)}
            regions={getTrackWaveformRegions(track)}
            editableCues={waveformEditableCues}
            editableLoops={track.performance.savedLoops}
            currentTime={currentTime}
            hero
            onSeek={monitor.seekGuideTrack}
            analysisProgress={monitor.playbackProgress}
            canEditBeatGrid={
              !trackMutating &&
              !track.performance.gridLock &&
              editableTrackBpm !== null &&
              track.analysis.durationSeconds !== null
            }
            onSetDownbeatAtSecond={
              editableTrackBpm !== null
                ? (second) =>
                    void onUpdateTrackAnalysis(
                      track.id,
                      createAnchoredBeatGridUpdate(
                        editableTrackBpm,
                        track.analysis.durationSeconds,
                        second,
                      ),
                    )
                : undefined
            }
            canSelectPhrase={hasUsableBeatGrid(track.analysis.beatGrid)}
            selectedPhraseRange={selectedPhraseRange}
            onSelectPhraseRange={setSelectedPhraseRange}
            canEditPerformance={!trackMutating}
            onMoveCue={handleMoveWaveformCue}
            onNudgeCue={handleMoveWaveformCue}
            onMoveLoopBoundary={(loopId, boundary, second) =>
              void onUpdateTrackPerformance(track.id, {
                savedLoops: setTrackSavedLoopBoundary(
                  track.performance.savedLoops,
                  loopId,
                  boundary,
                  second,
                  {
                    bpm: editableTrackBpm,
                    durationSeconds: track.analysis.durationSeconds,
                    beatGrid: track.analysis.beatGrid,
                    quantizeEnabled: quantizeWaveformEdits,
                  },
                ),
              })
            }
            onMoveLoop={(loopId, second) =>
              void onUpdateTrackPerformance(track.id, {
                savedLoops: moveTrackSavedLoop(
                  track.performance.savedLoops,
                  loopId,
                  second,
                  {
                    durationSeconds: track.analysis.durationSeconds,
                    beatGrid: track.analysis.beatGrid,
                    quantizeEnabled: quantizeWaveformEdits,
                  },
                ),
              })
            }
          />
          <TrackOriginalComparePanel
            track={track}
            currentTime={currentTime}
            onSeek={monitor.seekGuideTrack}
            onAudition={handleCompareAudition}
            activeAuditionId={activeCompareAuditionId}
          />
          <TrackPlaybackPanel
            track={track}
            onTimeUpdate={setCurrentTime}
            cueRequest={compareCueRequest}
            auditionLabel={activeCompareAuditionLabel}
          />
        </div>

        <div className="analyzer-layout">
          <div className="analyzer-main-stack">
            <BpmCurvePanel
              bpmCurve={track.analysis.bpmCurve}
              fallbackBpm={track.analysis.bpm}
              durationSeconds={track.analysis.durationSeconds}
            />
          </div>
          <div className="analyzer-sidebar">
            <div className="inspect-tabs">
              <ul className="inspect-tab-list" role="tablist">
                <li role="presentation">
                  <button
                    role="tab"
                    aria-selected={activeTab === "overview"}
                    aria-controls="tab-overview"
                    className="inspect-tab-button"
                    onClick={() => setActiveTab("overview")}
                  >
                    Overview
                  </button>
                </li>
                <li role="presentation">
                  <button
                    role="tab"
                    aria-selected={activeTab === "grid"}
                    aria-controls="tab-grid"
                    className="inspect-tab-button"
                    onClick={() => setActiveTab("grid")}
                  >
                    Beat Grid
                  </button>
                </li>
                <li role="presentation">
                  <button
                    role="tab"
                    aria-selected={activeTab === "performance"}
                    aria-controls="tab-performance"
                    className="inspect-tab-button"
                    onClick={() => setActiveTab("performance")}
                  >
                    Performance
                  </button>
                </li>
                <li role="presentation">
                  <button
                    role="tab"
                    aria-selected={activeTab === "metadata"}
                    aria-controls="tab-metadata"
                    className="inspect-tab-button"
                    onClick={() => setActiveTab("metadata")}
                  >
                    Details
                  </button>
                </li>
              </ul>

              {/* Overview Tab */}
              <section
                id="tab-overview"
                role="tabpanel"
                aria-hidden={activeTab !== "overview"}
                className="inspect-tab-content"
              >
                <BpmPanel track={track} />
                <RepoStatusPanel track={track} analyzerLabel={analyzerLabel} />
              </section>

              {/* Beat Grid Tab */}
              <section
                id="tab-grid"
                role="tabpanel"
                aria-hidden={activeTab !== "grid"}
                className="inspect-tab-content"
              >
                <BeatGridEditorPanel
                  track={track}
                  busy={trackMutating}
                  currentTime={currentTime}
                  onUpdateAnalysis={(input) => onUpdateTrackAnalysis(track.id, input)}
                />
              </section>

              {/* Performance Tab */}
              <section
                id="tab-performance"
                role="tabpanel"
                aria-hidden={activeTab !== "performance"}
                className="inspect-tab-content"
              >
                <TrackPerformancePanel
                  track={track}
                  busy={trackMutating}
                  currentTime={currentTime}
                  selectedPhraseRange={selectedPhraseRange}
                  onUpdatePerformance={(input) => onUpdateTrackPerformance(track.id, input)}
                />
              </section>

              {/* Metadata Tab */}
              <section
                id="tab-metadata"
                role="tabpanel"
                aria-hidden={activeTab !== "metadata"}
                className="inspect-tab-content"
              >
                <SongMetadataPanel track={track} />
                <section className="panel metric-panel">
                  <details className="panel-collapsible">
                    <summary className="panel-collapsible-summary">Notes &amp; analysis</summary>
                    <div className="panel-collapsible-body">
                      {track.analysis.notes.length > 0 && (
                        <ul className="stack-list note-list">
                          {track.analysis.notes.map((note) => <li key={note}>{note}</li>)}
                        </ul>
                      )}
                      <dl className="meta-list compact-meta">
                        <div><dt>Analysis mode</dt><dd>{formatAnalysisMode(track.analysis.analysisMode)}</dd></div>
                        <div><dt>Source path</dt><dd>{getTrackSourcePath(track)}</dd></div>
                        <div><dt>Storage path</dt><dd>{getTrackStoragePath(track) ?? "No snapshot"}</dd></div>
                      </dl>
                    </div>
                  </details>
                </section>
              </section>
            </div>

            <div className="inspect-compose-cta">
              <p className="support-copy">Ready to build a composition using this track?</p>
              <button type="button" className="action" onClick={onGoCompose}>
                Compose →
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── REPOSITORY / LOG ───────────────────────────────────────────────────────
  if (mode === "repo") {
    if (!repository) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div><p className="eyebrow">{t.inspect.title}</p><h2>No log / repo selected</h2></div>
          </header>
          {contextBar}
        </section>
      );
    }

    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{repository.title}</h2>
            <p className="support-copy">
              {repository.sourceKind === "file"
                ? "Log signal analysis — severity bursts, anomaly markers, and live-tail monitoring."
                : "Repository signal analysis — code structure heuristics mapped to BPM."}
            </p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Source</span>
              <strong>
                {repository.sourceKind === "directory" ? "Filesystem" : repository.sourceKind === "file" ? "Log file" : "GitHub URL"}
              </strong>
            </div>
            <div className="summary-pill">
              <span>Imported</span>
              <strong>{formatShortDate(repository.importedAt)}</strong>
            </div>
          </div>
        </header>
        {contextBar}

        <div className="analyzer-layout">
          <div className="analyzer-main-stack">
            <RepositoryOverviewPanel repository={repository} />
            {repository.sourceKind === "file" ? (
              <>
                <LogSignalPanel repository={repository} />
                <LiveLogMonitorPanel
                  repository={repository}
                  availableBaseAssets={availableBaseAssets}
                  availableCompositions={[]}
                  preferredBaseAssetId={baseAsset?.id}
                  preferredCompositionId={undefined}
                  availableTracks={availableTracks}
                  availablePlaylists={availablePlaylists}
                />
              </>
            ) : null}
          </div>
          <div className="analyzer-sidebar">
            <RepositoryMetricsPanel repository={repository} analyzerLabel={analyzerLabel} />
            <section className="panel metric-panel">
              <details className="panel-collapsible">
                <summary className="panel-collapsible-summary">Notes &amp; metadata</summary>
                <div className="panel-collapsible-body">
                  {repository.notes.length > 0 && (
                    <ul className="stack-list note-list">
                      {repository.notes.map((note) => <li key={note}>{note}</li>)}
                    </ul>
                  )}
                  <dl className="meta-list compact-meta">
                    <div><dt>Source path</dt><dd>{repository.sourcePath}</dd></div>
                    <div><dt>Storage path</dt><dd>{repository.storagePath ?? "No snapshot"}</dd></div>
                  </dl>
                </div>
              </details>
            </section>
            <div className="inspect-compose-cta">
              <p className="support-copy">Use this log's BPM signal in a composition?</p>
              <button type="button" className="action" onClick={onGoCompose}>
                Compose →
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── BASE ASSET ─────────────────────────────────────────────────────────────
  if (!baseAsset) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div><p className="eyebrow">{t.inspect.title}</p><h2>No base asset selected</h2></div>
        </header>
        {contextBar}
      </section>
    );
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{t.inspect.title}</p>
          <h2>{baseAsset.title}</h2>
          <p className="support-copy">Reusable asset registered in the base catalog.</p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>Category</span>
            <strong>{baseAsset.categoryLabel}</strong>
          </div>
          <div className="summary-pill">
            <span>Reusable</span>
            <strong>{baseAsset.reusable ? "Yes" : "Single-use"}</strong>
          </div>
          <div className="summary-pill">
            <span>Imported</span>
            <strong>{formatShortDate(baseAsset.importedAt)}</strong>
          </div>
        </div>
      </header>
      {contextBar}

      <div className="analyzer-layout">
        <BaseAssetOverviewPanel baseAsset={baseAsset} />
        <div className="analyzer-sidebar">
          <BaseAssetMetricsPanel baseAsset={baseAsset} analyzerLabel={analyzerLabel} />
          <section className="panel metric-panel">
            <details className="panel-collapsible">
              <summary className="panel-collapsible-summary">Notes &amp; metadata</summary>
              <div className="panel-collapsible-body">
                {baseAsset.notes.length > 0 && (
                  <ul className="stack-list note-list">
                    {baseAsset.notes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                )}
                <dl className="meta-list compact-meta">
                  <div><dt>Source path</dt><dd>{baseAsset.sourcePath}</dd></div>
                  <div><dt>Storage path</dt><dd>{baseAsset.storagePath}</dd></div>
                  <div><dt>Checksum</dt><dd>{baseAsset.checksum ?? "Pending"}</dd></div>
                </dl>
              </div>
            </details>
          </section>
          <div className="inspect-compose-cta">
            <p className="support-copy">Use this base asset in a composition?</p>
            <button type="button" className="action" onClick={onGoCompose}>
              Compose →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
