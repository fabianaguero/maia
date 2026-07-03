import { useMemo } from "react";

import type { AppTranslations } from "../../../i18n/en";
import { useWaveformPlaceholderInteractions } from "./useWaveformPlaceholderInteractions";
import { buildWaveformPlaceholderViewModel } from "./waveformPlaceholderViewModelRuntime";
import type { WaveformPlaceholderProps } from "./waveformPlaceholderTypes";

interface UseWaveformPlaceholderViewModelInput extends WaveformPlaceholderProps {
  t: AppTranslations;
}

export function useWaveformPlaceholderViewModel({
  t,
  bins,
  beatGrid,
  durationSeconds,
  hotCues = [],
  regions = [],
  editableCues = [],
  editableLoops = [],
  currentTime = 0,
  analysisProgress = null,
  canEditBeatGrid = false,
  onSeek,
  onSetDownbeatAtSecond,
  canSelectPhrase = false,
  selectedPhraseRange = null,
  onSelectPhraseRange,
  phraseBeatCount = 16,
  canEditPerformance = false,
  onMoveCue,
  onMoveLoopBoundary,
  onMoveLoop,
}: UseWaveformPlaceholderViewModelInput) {
  const interactions = useWaveformPlaceholderInteractions({
    beatGrid,
    durationSeconds,
    canEditBeatGrid,
    canSelectPhrase,
    canEditPerformance,
    phraseBeatCount,
    onSeek,
    onSetDownbeatAtSecond,
    onSelectPhraseRange,
    onMoveCue,
    onMoveLoopBoundary,
    onMoveLoop,
  });

  const viewModel = useMemo(
    () =>
      buildWaveformPlaceholderViewModel({
        t,
        bins,
        beatGrid,
        durationSeconds,
        hotCues,
        regions,
        editableCues,
        editableLoops,
        currentTime,
        analysisProgress,
        canEditBeatGrid,
        canSelectPhrase,
        selectedPhraseRange,
        onSeek,
        onSelectPhraseRange,
        phraseBeatCount,
        interactions,
      }),
    [
      analysisProgress,
      beatGrid,
      bins,
      canEditBeatGrid,
      canSelectPhrase,
      currentTime,
      durationSeconds,
      editableCues,
      editableLoops,
      hotCues,
      interactions,
      onSeek,
      onSelectPhraseRange,
      phraseBeatCount,
      regions,
      selectedPhraseRange,
      t,
    ],
  );

  return {
    ...interactions,
    ...viewModel,
  };
}
