import type { ReactNode } from "react";

import type {
  LibraryTrack,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";
import { BeatGridEditorPanel } from "../analyzer/components/BeatGridEditorPanel";
import { BpmCurvePanel } from "../analyzer/components/BpmCurvePanel";
import { BpmPanel } from "../analyzer/components/BpmPanel";
import { RepoStatusPanel } from "../analyzer/components/RepoStatusPanel";
import { SongMetadataPanel } from "../analyzer/components/SongMetadataPanel";
import { TrackOriginalComparePanel } from "../analyzer/components/TrackOriginalComparePanel";
import { TrackPerformancePanel } from "../analyzer/components/TrackPerformancePanel";
import { TrackPlaybackPanel } from "../analyzer/components/TrackPlaybackPanel";
import { WaveformPlaceholder } from "../analyzer/components/WaveformPlaceholder";
import { InspectTrackHeader } from "./InspectTrackHeader";
import { InspectTrackMetadataPanel } from "./InspectTrackMetadataPanel";
import { InspectTrackSidebarTabs } from "./InspectTrackSidebarTabs";
import { buildInspectTrackViewModel } from "./inspectTrackViewModelRuntime";
import { useInspectTrackViewController } from "./useInspectTrackViewController";

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
  const viewModel = buildInspectTrackViewModel({
    track,
    trackMutating,
    t,
  });
  const {
    currentTime,
    setCurrentTime,
    selectedPhraseRange,
    setSelectedPhraseRange,
    compareCueRequest,
    activeCompareAuditionId,
    activeCompareAuditionLabel,
    activeTab,
    setActiveTab,
    handleMoveWaveformCue,
    handleCompareAudition,
    handleSetDownbeatAtSecond,
    handleMoveLoopBoundary,
    handleMoveLoop,
  } = useInspectTrackViewController({
    track,
    viewModel,
    onSeekGuideTrack: monitor.seekGuideTrack,
    onUpdateTrackPerformance,
    onUpdateTrackAnalysis,
  });

  return (
    <section className="screen">
      <InspectTrackHeader
        eyebrow={t.inspect.title}
        title={track.tags.title}
        description={t.inspect.copy}
        summaryPills={viewModel.summaryPills}
        contextBar={contextBar}
      />

      <div className="analyzer-deck">
        <WaveformPlaceholder
          bins={track.analysis.waveformBins}
          beatGrid={track.analysis.beatGrid}
          durationSeconds={track.analysis.durationSeconds}
          hotCues={viewModel.waveformCues}
          regions={viewModel.waveformRegions}
          editableCues={viewModel.waveformModel.editableCues}
          editableLoops={track.performance.savedLoops}
          currentTime={currentTime}
          hero
          onSeek={monitor.seekGuideTrack}
          analysisProgress={monitor.playbackProgress}
          canEditBeatGrid={viewModel.waveformModel.canEditBeatGrid}
          onSetDownbeatAtSecond={handleSetDownbeatAtSecond}
          canSelectPhrase={viewModel.canSelectPhrase}
          selectedPhraseRange={selectedPhraseRange}
          onSelectPhraseRange={setSelectedPhraseRange}
          canEditPerformance={!trackMutating}
          onMoveCue={handleMoveWaveformCue}
          onNudgeCue={handleMoveWaveformCue}
          onMoveLoopBoundary={handleMoveLoopBoundary}
          onMoveLoop={handleMoveLoop}
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
          tabs={viewModel.tabs}
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
                details={viewModel.metadataDetails}
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
