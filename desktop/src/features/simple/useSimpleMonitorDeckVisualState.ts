import { useEffect } from "react";

import type { BeatGridPoint } from "../../types/library";
import { renderMonitorDeckCanvas, renderMonitorOverviewCanvas } from "./monitorDeckCanvas";
import { type WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  buildMonitorDeckScrubHookInput,
  buildSimpleMonitorDeckVisualDerivedState,
} from "./simpleMonitorDeckVisualRuntime";
import { useMonitorDeckScrub } from "./useMonitorDeckScrub";

interface UseSimpleMonitorDeckVisualStateInput {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformBins?: number[] | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  deckDurationSeconds: number | null;
  deckBpm: number | null;
  activeBeatGrid: BeatGridPoint[] | null;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
  deckVisualPreset: "passive" | "balanced" | "alert";
  waveformScale: number;
  safeRuntime?: boolean;
}

export function useSimpleMonitorDeckVisualState({
  backgroundAudioRef,
  waveformBins,
  waveformAnomalies,
  trackWaveProgress,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  deckDurationSeconds,
  deckBpm,
  activeBeatGrid,
  logSignalBuffer,
  selectedAnomalyId,
  isConsoleExpanded,
  onToggleConsole,
  onSelectAnomalyForFocus,
  deckVisualPreset,
  waveformScale,
  safeRuntime = false,
}: UseSimpleMonitorDeckVisualStateInput) {
  const {
    visibleWindowSeconds,
    trackWaveSamples,
    deckTimelineMarkers,
    deckBeatMarkers,
    derivedDeckState,
  } = buildSimpleMonitorDeckVisualDerivedState({
    waveformBins,
    waveformAnomalies,
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
    logSignalBuffer,
    selectedAnomalyId,
  });
  const scrub = useMonitorDeckScrub(
    buildMonitorDeckScrubHookInput({
      backgroundAudioRef,
      waveformAnomalies,
      trackWaveProgress,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      isConsoleExpanded,
      onToggleConsole,
      onSelectAnomalyForFocus,
    }),
  );

  useEffect(() => {
    if (safeRuntime) {
      return;
    }
    const canvas = scrub.overviewCanvasRef.current;
    if (!canvas) {
      return;
    }

    renderMonitorOverviewCanvas({
      canvas,
      overviewWaveSamples: derivedDeckState.overviewWaveSamples,
      overviewAnomalyDensity: derivedDeckState.overviewAnomalyDensity,
      anomalyBurstRegions: derivedDeckState.anomalyBurstRegions,
      waveformAnomalies,
      selectedDeckMarker: derivedDeckState.selectedDeckMarker,
      visualPreset: deckVisualPreset,
    });
  }, [
    deckVisualPreset,
    derivedDeckState.anomalyBurstRegions,
    derivedDeckState.overviewAnomalyDensity,
    derivedDeckState.overviewWaveSamples,
    derivedDeckState.selectedDeckMarker,
    scrub.overviewCanvasRef,
    safeRuntime,
    waveformAnomalies,
  ]);

  useEffect(() => {
    if (safeRuntime) {
      return;
    }
    const canvas = scrub.waveformCanvasRef.current;
    const stage = scrub.waveformStageRef.current;
    if (!canvas || !stage) {
      return;
    }

    renderMonitorDeckCanvas({
      canvas,
      stage,
      trackWaveSamples,
      logWaveOverlay: derivedDeckState.logWaveOverlay,
      anomalyBurstRegions: derivedDeckState.anomalyBurstRegions,
      selectedDeckMarker: derivedDeckState.selectedDeckMarker,
      waveformAnomalies,
      trackWaveProgress,
      visualPreset: deckVisualPreset,
    });
  }, [
    deckVisualPreset,
    derivedDeckState.anomalyBurstRegions,
    derivedDeckState.logWaveOverlay,
    derivedDeckState.selectedDeckMarker,
    safeRuntime,
    scrub.waveformCanvasRef,
    scrub.waveformStageRef,
    trackWaveProgress,
    trackWaveSamples,
    waveformAnomalies,
    waveformScale,
  ]);

  return {
    ...scrub,
    ...derivedDeckState,
    visibleWindowSeconds,
    trackWaveSamples,
    deckTimelineMarkers,
    deckBeatMarkers,
  };
}
