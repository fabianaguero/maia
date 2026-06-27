import { useEffect, useState, type ReactNode } from "react";

import type {
  LibraryTrack,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import {
  createAnchoredBeatGridUpdate,
  isEditableBpm,
  type BeatGridPhraseRange,
} from "../../utils/beatGrid";
import {
  getTrackSourcePath,
  getTrackStoragePath,
  getTrackWaveformCues,
  getTrackWaveformRegions,
  hasUsableBeatGrid,
  moveTrackSavedLoop,
  resolveTrackPlacementSecond,
  setTrackCuePointSecond,
  setTrackSavedLoopBoundary,
  type TrackCompareAuditionPoint,
} from "../../utils/track";
import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";
import { BeatGridEditorPanel } from "../analyzer/components/BeatGridEditorPanel";
import { BpmCurvePanel } from "../analyzer/components/BpmCurvePanel";
import { BpmPanel } from "../analyzer/components/BpmPanel";
import type { ManagedAudioCueRequest } from "../analyzer/components/ManagedAudioPlayer";
import { RepoStatusPanel } from "../analyzer/components/RepoStatusPanel";
import { SongMetadataPanel } from "../analyzer/components/SongMetadataPanel";
import { TrackOriginalComparePanel } from "../analyzer/components/TrackOriginalComparePanel";
import { TrackPerformancePanel } from "../analyzer/components/TrackPerformancePanel";
import { TrackPlaybackPanel } from "../analyzer/components/TrackPlaybackPanel";
import { WaveformPlaceholder } from "../analyzer/components/WaveformPlaceholder";

function formatAnalysisMode(analysisMode: string): string {
  return analysisMode
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

interface InspectTrackViewProps {
  track: LibraryTrack;
  analyzerLabel: string;
  trackMutating: boolean;
  contextBar: ReactNode;
  onGoCompose: () => void;
  onUpdateTrackPerformance: (trackId: string, input: UpdateTrackPerformanceInput) => Promise<void>;
  onUpdateTrackAnalysis: (trackId: string, input: UpdateTrackAnalysisInput) => Promise<void>;
}

export function InspectTrackView({
  track,
  analyzerLabel,
  trackMutating,
  contextBar,
  onGoCompose,
  onUpdateTrackPerformance,
  onUpdateTrackAnalysis,
}: InspectTrackViewProps) {
  const t = useT();
  const monitor = useMonitor();
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPhraseRange, setSelectedPhraseRange] = useState<BeatGridPhraseRange | null>(null);
  const [compareCueRequest, setCompareCueRequest] = useState<ManagedAudioCueRequest | null>(null);
  const [activeCompareAuditionId, setActiveCompareAuditionId] = useState<
    TrackCompareAuditionPoint["id"] | null
  >(null);
  const [activeCompareAuditionLabel, setActiveCompareAuditionLabel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "grid" | "performance" | "metadata">(
    "overview",
  );
  const activeTrackId = track.id;
  const activeBeatGridLength = track.analysis.beatGrid.length;
  const activeFirstBeatSecond = track.analysis.beatGrid[0]?.second ?? null;
  const activeTrackDurationSeconds = track.analysis.durationSeconds ?? null;

  useEffect(() => {
    setSelectedPhraseRange(null);
    setCompareCueRequest(null);
    setActiveCompareAuditionId(null);
    setActiveCompareAuditionLabel(null);
  }, [activeBeatGridLength, activeFirstBeatSecond, activeTrackDurationSeconds, activeTrackId]);

  const editableTrackBpm = isEditableBpm(track.analysis.bpm) ? track.analysis.bpm : null;
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

    const cueCollection = cue.kind === "hot" ? track.performance.hotCues : track.performance.memoryCues;
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
            <span>{t.inspect.status}</span>
            <strong>{track.analysis.analyzerStatus}</strong>
          </div>
          <div className="summary-pill">
            <span>{t.inspect.style}</span>
            <strong>{track.tags.musicStyleLabel}</strong>
          </div>
          <div className="summary-pill">
            <span>{t.inspect.imported}</span>
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
              savedLoops: moveTrackSavedLoop(track.performance.savedLoops, loopId, second, {
                durationSeconds: track.analysis.durationSeconds,
                beatGrid: track.analysis.beatGrid,
                quantizeEnabled: quantizeWaveformEdits,
              }),
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
                  {t.inspect.overview}
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
                  {t.inspect.beatGrid}
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
                  {t.inspect.performance}
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
                  {t.inspect.details}
                </button>
              </li>
            </ul>

            <section
              id="tab-overview"
              role="tabpanel"
              aria-hidden={activeTab !== "overview"}
              className="inspect-tab-content"
            >
              <BpmPanel track={track} />
              <RepoStatusPanel track={track} analyzerLabel={analyzerLabel} />
            </section>

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

            <section
              id="tab-metadata"
              role="tabpanel"
              aria-hidden={activeTab !== "metadata"}
              className="inspect-tab-content"
            >
              <SongMetadataPanel track={track} />
              <section className="panel metric-panel">
                <details className="panel-collapsible">
                  <summary className="panel-collapsible-summary">{t.inspect.notesAnalysis}</summary>
                  <div className="panel-collapsible-body">
                    {track.analysis.notes.length > 0 && (
                      <ul className="stack-list note-list">
                        {track.analysis.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    )}
                    <dl className="meta-list compact-meta">
                      <div>
                        <dt>{t.inspect.analysisMode}</dt>
                        <dd>{formatAnalysisMode(track.analysis.analysisMode)}</dd>
                      </div>
                      <div>
                        <dt>{t.inspect.sourcePath}</dt>
                        <dd>{getTrackSourcePath(track)}</dd>
                      </div>
                      <div>
                        <dt>{t.inspect.storagePath}</dt>
                        <dd>{getTrackStoragePath(track) ?? t.inspect.noSnapshot}</dd>
                      </div>
                    </dl>
                  </div>
                </details>
              </section>
            </section>
          </div>

          <div className="inspect-compose-cta">
            <p className="support-copy">{t.inspect.buildCompositionTrack}</p>
            <button type="button" className="action" onClick={onGoCompose}>
              {t.inspect.composeCta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
