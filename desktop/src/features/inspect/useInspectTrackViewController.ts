import { useEffect, useState } from "react";

import type {
  LibraryTrack,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import type { BeatGridPhraseRange } from "../../utils/beatGrid";
import type { TrackCompareAuditionPoint } from "../../utils/track";
import type { ManagedAudioCueRequest } from "../analyzer/components/ManagedAudioPlayer";

import { buildInspectTrackCompareAuditionViewState } from "./inspectTrackViewControllerRuntime";
import type { InspectTrackViewModel } from "./inspectTrackViewModelRuntime";
import {
  buildInspectTrackAnchoredBeatGridAnalysisPatch,
  buildInspectTrackMovedCuePerformancePatch,
  buildInspectTrackMoveLoopBoundaryPerformancePatch,
  buildInspectTrackMoveLoopPerformancePatch,
  type InspectTrackTabId,
} from "./inspectTrackViewRuntime";

interface InspectTrackViewControllerInput {
  track: LibraryTrack;
  viewModel: InspectTrackViewModel;
  onSeekGuideTrack: (second: number) => void;
  onUpdateTrackPerformance: (trackId: string, input: UpdateTrackPerformanceInput) => Promise<void>;
  onUpdateTrackAnalysis: (trackId: string, input: UpdateTrackAnalysisInput) => Promise<void>;
}

interface InspectTrackWaveformCueInput {
  id: string;
  second: number;
  label: string;
  kind: "main" | "hot" | "memory";
}

export function useInspectTrackViewController({
  track,
  viewModel,
  onSeekGuideTrack,
  onUpdateTrackPerformance,
  onUpdateTrackAnalysis,
}: InspectTrackViewControllerInput) {
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPhraseRange, setSelectedPhraseRange] = useState<BeatGridPhraseRange | null>(null);
  const [compareCueRequest, setCompareCueRequest] = useState<ManagedAudioCueRequest | null>(null);
  const [activeCompareAuditionId, setActiveCompareAuditionId] = useState<
    TrackCompareAuditionPoint["id"] | null
  >(null);
  const [activeCompareAuditionLabel, setActiveCompareAuditionLabel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InspectTrackTabId>("overview");

  useEffect(() => {
    setSelectedPhraseRange(null);
    setCompareCueRequest(null);
    setActiveCompareAuditionId(null);
    setActiveCompareAuditionLabel(null);
  }, [viewModel.resetKey]);

  const handleMoveWaveformCue = (cue: InspectTrackWaveformCueInput, second: number) => {
    return void onUpdateTrackPerformance(
      track.id,
      buildInspectTrackMovedCuePerformancePatch({
        track,
        cue,
        second,
        quantizeWaveformEdits: viewModel.waveformModel.quantizeWaveformEdits,
      }),
    );
  };

  const handleCompareAudition = (point: TrackCompareAuditionPoint) => {
    const nextState = buildInspectTrackCompareAuditionViewState({
      previousCueRequest: compareCueRequest,
      point,
    });
    setCurrentTime(nextState.currentTime);
    onSeekGuideTrack(point.second);
    setActiveCompareAuditionId(nextState.activeCompareAuditionId);
    setActiveCompareAuditionLabel(nextState.activeCompareAuditionLabel);
    setCompareCueRequest(nextState.cueRequest);
  };

  const handleSetDownbeatAtSecond =
    viewModel.waveformModel.editableTrackBpm !== null
      ? (second: number) => {
          const patch = buildInspectTrackAnchoredBeatGridAnalysisPatch({
            track,
            second,
            editableTrackBpm: viewModel.waveformModel.editableTrackBpm,
          });
          if (patch) {
            void onUpdateTrackAnalysis(track.id, patch);
          }
        }
      : undefined;

  const handleMoveLoopBoundary = (loopId: string, boundary: "start" | "end", second: number) =>
    void onUpdateTrackPerformance(
      track.id,
      buildInspectTrackMoveLoopBoundaryPerformancePatch({
        track,
        loopId,
        boundary,
        second,
        editableTrackBpm: viewModel.waveformModel.editableTrackBpm,
        quantizeWaveformEdits: viewModel.waveformModel.quantizeWaveformEdits,
      }),
    );

  const handleMoveLoop = (loopId: string, second: number) =>
    void onUpdateTrackPerformance(
      track.id,
      buildInspectTrackMoveLoopPerformancePatch({
        track,
        loopId,
        second,
        quantizeWaveformEdits: viewModel.waveformModel.quantizeWaveformEdits,
      }),
    );

  return {
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
  };
}
