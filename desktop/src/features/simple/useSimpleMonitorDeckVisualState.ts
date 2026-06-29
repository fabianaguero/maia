import { useEffect } from "react";

import type { BeatGridPoint } from "../../types/library";
import { renderMonitorDeckCanvas, renderMonitorOverviewCanvas } from "./monitorDeckCanvas";
import { type WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  buildMonitorOverviewRenderPlan,
  buildMonitorWaveformRenderPlan,
} from "./simpleMonitorDeckVisualStateRuntime";
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
  const {
    overviewWaveSamples,
    overviewAnomalyDensity,
    anomalyBurstRegions,
    selectedDeckMarker,
    logWaveOverlay,
  } = derivedDeckState;
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
    const renderPlan = buildMonitorOverviewRenderPlan({
      safeRuntime,
      canvas: scrub.overviewCanvasRef.current,
      derivedDeckState: {
        overviewWaveSamples,
        overviewAnomalyDensity,
        anomalyBurstRegions,
        selectedDeckMarker,
      } as typeof derivedDeckState,
      waveformAnomalies,
      deckVisualPreset,
    });
    if (!renderPlan) {
      return;
    }

    renderMonitorOverviewCanvas(renderPlan);
  }, [
    deckVisualPreset,
    anomalyBurstRegions,
    overviewAnomalyDensity,
    overviewWaveSamples,
    selectedDeckMarker,
    scrub.overviewCanvasRef,
    safeRuntime,
    waveformAnomalies,
  ]);

  useEffect(() => {
    const renderPlan = buildMonitorWaveformRenderPlan({
      safeRuntime,
      canvas: scrub.waveformCanvasRef.current,
      stage: scrub.waveformStageRef.current,
      trackWaveSamples,
      derivedDeckState: {
        logWaveOverlay,
        anomalyBurstRegions,
        selectedDeckMarker,
      } as typeof derivedDeckState,
      waveformAnomalies,
      trackWaveProgress,
      deckVisualPreset,
    });
    if (!renderPlan) {
      return;
    }

    renderMonitorDeckCanvas(renderPlan);
  }, [
    deckVisualPreset,
    anomalyBurstRegions,
    logWaveOverlay,
    selectedDeckMarker,
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
