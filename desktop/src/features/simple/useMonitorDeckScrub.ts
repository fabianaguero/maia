import { useEffect, useRef } from "react";

import {
  buildMonitorDeckScrubInteractionHandlers,
  buildMonitorDeckScrubSeekHandlers,
  buildMonitorDeckScrubWindowHandlers,
} from "./monitorDeckScrubControllerRuntime";
import { buildMonitorDeckScrubHookState } from "./monitorDeckScrubHookStateRuntime";
import type { UseMonitorDeckScrubOptions } from "./monitorDeckScrubTypes";

export function useMonitorDeckScrub({
  backgroundAudioRef,
  waveformAnomalies,
  trackWaveProgress,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  isConsoleExpanded,
  onToggleConsole,
  onSelectAnomalyForFocus,
  onWaveformClick,
}: UseMonitorDeckScrubOptions) {
  const waveformStageRef = useRef<HTMLDivElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isOverviewScrubbingRef = useRef(false);
  const activeOverviewPointerIdRef = useRef<number | null>(null);
  const isDeckScrubbingRef = useRef(false);
  const activeDeckPointerIdRef = useRef<number | null>(null);
  const deckScrubStartProgressRef = useRef(0);
  const deckScrubStartRatioRef = useRef(0.5);
  const { seekToTrackProgress, seekTrackFromViewport, seekTrackFromOverviewViewport } =
    buildMonitorDeckScrubSeekHandlers({
      refs: {
        overviewCanvasRef,
        waveformStageRef,
        deckScrubStartProgressRef,
        deckScrubStartRatioRef,
      },
      backgroundAudioRef,
      waveformAnomalies,
      isConsoleExpanded,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      onSelectAnomalyForFocus,
      onToggleConsole,
      onWaveformClick,
    });

  useEffect(() => {
    const { handlePointerMove, stopScrubbing } = buildMonitorDeckScrubWindowHandlers({
      refs: {
        isOverviewScrubbingRef,
        activeOverviewPointerIdRef,
        isDeckScrubbingRef,
        activeDeckPointerIdRef,
      },
      seekTrackFromOverviewViewport,
      seekTrackFromViewport,
    });

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopScrubbing);
    window.addEventListener("pointercancel", stopScrubbing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopScrubbing);
      window.removeEventListener("pointercancel", stopScrubbing);
    };
  }, [seekTrackFromOverviewViewport, seekTrackFromViewport]);

  const interactionHandlers = buildMonitorDeckScrubInteractionHandlers({
    refs: {
      overviewCanvasRef,
      waveformStageRef,
      isOverviewScrubbingRef,
      activeOverviewPointerIdRef,
      isDeckScrubbingRef,
      activeDeckPointerIdRef,
      deckScrubStartProgressRef,
      deckScrubStartRatioRef,
    },
    trackWaveProgress,
    isConsoleExpanded,
    seekToTrackProgress,
    seekTrackFromOverviewViewport,
    seekTrackFromViewport,
    onSelectAnomalyForFocus,
    onToggleConsole,
  });

  return buildMonitorDeckScrubHookState({
    overviewCanvasRef,
    waveformCanvasRef,
    waveformStageRef,
    seekToTrackProgress,
    seekTrackFromOverviewViewport,
    seekTrackFromViewport,
    interactionHandlers,
  });
}
