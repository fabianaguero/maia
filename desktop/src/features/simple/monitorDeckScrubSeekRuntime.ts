import {
  resolveOverviewViewportSeekProgress,
  resolveStageViewportSeekProgress,
} from "./monitorDeckScrubViewportRuntime";
import { resolveMonitorDeckSeekState } from "./monitorDeckScrubOrchestrationRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorDeckScrubRefs } from "./monitorDeckScrubControllerTypes";

export function buildMonitorDeckScrubSeekHandlers(input: {
  refs: Pick<
    MonitorDeckScrubRefs,
    | "overviewCanvasRef"
    | "waveformStageRef"
    | "deckScrubStartProgressRef"
    | "deckScrubStartRatioRef"
  >;
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformAnomalies: WaveformAnomalyMarker[];
  isConsoleExpanded: boolean;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
  onToggleConsole?: () => void;
}) {
  const seekToTrackProgress = (nextProgress: number) => {
    const seekState = resolveMonitorDeckSeekState({
      audio: input.backgroundAudioRef.current,
      nextProgress,
      waveformAnomalies: input.waveformAnomalies,
      isConsoleExpanded: input.isConsoleExpanded,
    });
    if (!seekState) {
      return;
    }

    const audio = input.backgroundAudioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = seekState.currentTime;
    input.setTrackWaveProgress(seekState.clampedProgress);
    input.setTrackElapsedSeconds(seekState.currentTime);

    if (seekState.focusedAnomalyId) {
      input.onSelectAnomalyForFocus(seekState.focusedAnomalyId);
    }
    if (seekState.shouldOpenConsole) {
      input.onToggleConsole?.();
    }
  };

  const seekTrackFromViewport = (clientX: number) => {
    const nextProgress = resolveStageViewportSeekProgress({
      stage: input.refs.waveformStageRef.current,
      clientX,
      startRatio: input.refs.deckScrubStartRatioRef.current,
      startProgress: input.refs.deckScrubStartProgressRef.current,
    });
    if (nextProgress === null) {
      return;
    }
    seekToTrackProgress(nextProgress);
  };

  const seekTrackFromOverviewViewport = (clientX: number) => {
    const nextProgress = resolveOverviewViewportSeekProgress({
      canvas: input.refs.overviewCanvasRef.current,
      clientX,
    });
    if (nextProgress === null) {
      return;
    }
    seekToTrackProgress(nextProgress);
  };

  return {
    seekToTrackProgress,
    seekTrackFromViewport,
    seekTrackFromOverviewViewport,
  };
}
