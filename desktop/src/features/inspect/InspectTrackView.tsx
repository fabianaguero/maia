import { useEffect, useState, type ReactNode } from "react";

import type {
  LibraryTrack,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import type { BeatGridPhraseRange } from "../../utils/beatGrid";
import {
  getTrackWaveformCues,
  getTrackWaveformRegions,
  hasUsableBeatGrid,
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
import { InspectTrackHeader } from "./InspectTrackHeader";
import { InspectTrackMetadataPanel } from "./InspectTrackMetadataPanel";
import { InspectTrackSidebarTabs } from "./InspectTrackSidebarTabs";
import {
  buildInspectTrackAnchoredBeatGridAnalysisPatch,
  buildInspectTrackMetadataDetails,
  buildInspectTrackMovedCuePerformancePatch,
  buildInspectTrackMoveLoopBoundaryPerformancePatch,
  buildInspectTrackMoveLoopPerformancePatch,
  buildInspectTrackSummaryPills,
  buildInspectTrackTabViewModel,
  buildInspectTrackWaveformModel,
  type InspectTrackTabId,
} from "./inspectTrackViewRuntime";

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
  const [activeTab, setActiveTab] = useState<InspectTrackTabId>("overview");
  const activeTrackId = track.id;
  const activeBeatGridLength = track.analysis.beatGrid.length;
  const activeFirstBeatSecond = track.analysis.beatGrid[0]?.second ?? null;
  const activeTrackDurationSeconds = track.analysis.durationSeconds ?? null;
  const tabs = buildInspectTrackTabViewModel(t);
  const summaryPills = buildInspectTrackSummaryPills(track, t);
  const metadataDetails = buildInspectTrackMetadataDetails(track, t);
  const waveformModel = buildInspectTrackWaveformModel({
    track,
    trackMutating,
  });

  useEffect(() => {
    setSelectedPhraseRange(null);
    setCompareCueRequest(null);
    setActiveCompareAuditionId(null);
    setActiveCompareAuditionLabel(null);
  }, [activeBeatGridLength, activeFirstBeatSecond, activeTrackDurationSeconds, activeTrackId]);

  const handleMoveWaveformCue = (
    cue: {
      id: string;
      second: number;
      label: string;
      kind: "main" | "hot" | "memory";
    },
    second: number,
  ) => {
    return void onUpdateTrackPerformance(
      track.id,
      buildInspectTrackMovedCuePerformancePatch({
        track,
        cue,
        second,
        quantizeWaveformEdits: waveformModel.quantizeWaveformEdits,
      }),
    );
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
      <InspectTrackHeader
        eyebrow={t.inspect.title}
        title={track.tags.title}
        description={t.inspect.copy}
        summaryPills={summaryPills}
        contextBar={contextBar}
      />

      <div className="analyzer-deck">
        <WaveformPlaceholder
          bins={track.analysis.waveformBins}
          beatGrid={track.analysis.beatGrid}
          durationSeconds={track.analysis.durationSeconds}
          hotCues={getTrackWaveformCues(track)}
          regions={getTrackWaveformRegions(track)}
          editableCues={waveformModel.editableCues}
          editableLoops={track.performance.savedLoops}
          currentTime={currentTime}
          hero
          onSeek={monitor.seekGuideTrack}
          analysisProgress={monitor.playbackProgress}
          canEditBeatGrid={waveformModel.canEditBeatGrid}
          onSetDownbeatAtSecond={
            waveformModel.editableTrackBpm !== null
              ? (second) => {
                  const patch = buildInspectTrackAnchoredBeatGridAnalysisPatch({
                    track,
                    second,
                    editableTrackBpm: waveformModel.editableTrackBpm,
                  });
                  if (patch) {
                    void onUpdateTrackAnalysis(track.id, patch);
                  }
                }
              : undefined
          }
          canSelectPhrase={hasUsableBeatGrid(track.analysis.beatGrid)}
          selectedPhraseRange={selectedPhraseRange}
          onSelectPhraseRange={setSelectedPhraseRange}
          canEditPerformance={!trackMutating}
          onMoveCue={handleMoveWaveformCue}
          onNudgeCue={handleMoveWaveformCue}
          onMoveLoopBoundary={(loopId, boundary, second) =>
            void onUpdateTrackPerformance(
              track.id,
              buildInspectTrackMoveLoopBoundaryPerformancePatch({
                track,
                loopId,
                boundary,
                second,
                editableTrackBpm: waveformModel.editableTrackBpm,
                quantizeWaveformEdits: waveformModel.quantizeWaveformEdits,
              }),
            )
          }
          onMoveLoop={(loopId, second) =>
            void onUpdateTrackPerformance(
              track.id,
              buildInspectTrackMoveLoopPerformancePatch({
                track,
                loopId,
                second,
                quantizeWaveformEdits: waveformModel.quantizeWaveformEdits,
              }),
            )
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
        <InspectTrackSidebarTabs
          tabs={tabs}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          overviewPanel={
            <>
              <BpmPanel track={track} />
              <RepoStatusPanel track={track} analyzerLabel={analyzerLabel} />
            </>
          }
          gridPanel={
            <BeatGridEditorPanel
              track={track}
              busy={trackMutating}
              currentTime={currentTime}
              onUpdateAnalysis={(input) => onUpdateTrackAnalysis(track.id, input)}
            />
          }
          performancePanel={
            <TrackPerformancePanel
              track={track}
              busy={trackMutating}
              currentTime={currentTime}
              selectedPhraseRange={selectedPhraseRange}
              onUpdatePerformance={(input) => onUpdateTrackPerformance(track.id, input)}
            />
          }
          metadataPanel={
            <>
              <SongMetadataPanel track={track} />
              <InspectTrackMetadataPanel
                notesSummaryLabel={t.inspect.notesAnalysis}
                noteItems={track.analysis.notes}
                details={metadataDetails}
              />
            </>
          }
          composeCopy={t.inspect.buildCompositionTrack}
          composeLabel={t.inspect.composeCta}
          onGoCompose={onGoCompose}
        />
      </div>
    </section>
  );
}
