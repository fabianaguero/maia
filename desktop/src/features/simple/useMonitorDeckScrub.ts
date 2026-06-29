import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import { resolveDeckScrubProgress, resolveOverviewScrubProgress } from "./monitorDeckScrubRuntime";
import {
  buildDeckScrubPointerState,
  buildOverviewScrubPointerState,
  resolveMonitorDeckSeekState,
  resolveStoppedMonitorScrubPointerState,
  shouldProcessMonitorScrubPointer,
} from "./monitorDeckScrubOrchestrationRuntime";

interface UseMonitorDeckScrubOptions {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
}

interface DeckOverviewScrubMarker {
  id: string;
  progress: number;
}

export function useMonitorDeckScrub({
  backgroundAudioRef,
  waveformAnomalies,
  trackWaveProgress,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  isConsoleExpanded,
  onToggleConsole,
  onSelectAnomalyForFocus,
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

  const seekToTrackProgress = useCallback(
    (nextProgress: number) => {
      const seekState = resolveMonitorDeckSeekState({
        audio: backgroundAudioRef.current,
        nextProgress,
        waveformAnomalies,
        isConsoleExpanded,
      });
      if (!seekState) {
        return;
      }

      const audio = backgroundAudioRef.current;
      if (!audio) {
        return;
      }
      audio.currentTime = seekState.currentTime;
      setTrackWaveProgress(seekState.clampedProgress);
      setTrackElapsedSeconds(seekState.currentTime);

      if (seekState.focusedAnomalyId) {
        onSelectAnomalyForFocus(seekState.focusedAnomalyId);
      }
      if (seekState.shouldOpenConsole) {
        onToggleConsole?.();
      }
    },
    [
      backgroundAudioRef,
      isConsoleExpanded,
      onSelectAnomalyForFocus,
      onToggleConsole,
      setTrackElapsedSeconds,
      setTrackWaveProgress,
      waveformAnomalies,
    ],
  );

  const seekTrackFromViewport = useCallback(
    (clientX: number) => {
      const stage = waveformStageRef.current;
      if (!stage) {
        return;
      }

      const rect = stage.getBoundingClientRect();
      const nextProgress = resolveDeckScrubProgress({
        clientX,
        left: rect.left,
        width: rect.width,
        startRatio: deckScrubStartRatioRef.current,
        startProgress: deckScrubStartProgressRef.current,
      });
      seekToTrackProgress(nextProgress);
    },
    [seekToTrackProgress],
  );

  const seekTrackFromOverviewViewport = useCallback(
    (clientX: number) => {
      const canvas = overviewCanvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const nextProgress = resolveOverviewScrubProgress({
        clientX,
        left: rect.left,
        width: rect.width,
      });
      seekToTrackProgress(nextProgress);
    },
    [seekToTrackProgress],
  );

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (
        shouldProcessMonitorScrubPointer({
          isScrubbing: isOverviewScrubbingRef.current,
          activePointerId: activeOverviewPointerIdRef.current,
          eventPointerId: event.pointerId,
        })
      ) {
        seekTrackFromOverviewViewport(event.clientX);
      }

      if (
        shouldProcessMonitorScrubPointer({
          isScrubbing: isDeckScrubbingRef.current,
          activePointerId: activeDeckPointerIdRef.current,
          eventPointerId: event.pointerId,
        })
      ) {
        seekTrackFromViewport(event.clientX);
      }
    };

    const stopScrubbing = (event: globalThis.PointerEvent) => {
      const overviewState = resolveStoppedMonitorScrubPointerState({
        activePointerId: activeOverviewPointerIdRef.current,
        eventPointerId: event.pointerId,
      });
      isOverviewScrubbingRef.current = overviewState.isScrubbing;
      activeOverviewPointerIdRef.current = overviewState.activePointerId;

      const deckState = resolveStoppedMonitorScrubPointerState({
        activePointerId: activeDeckPointerIdRef.current,
        eventPointerId: event.pointerId,
      });
      isDeckScrubbingRef.current = deckState.isScrubbing;
      activeDeckPointerIdRef.current = deckState.activePointerId;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopScrubbing);
    window.addEventListener("pointercancel", stopScrubbing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopScrubbing);
      window.removeEventListener("pointercancel", stopScrubbing);
    };
  }, [seekTrackFromOverviewViewport, seekTrackFromViewport]);

  return {
    overviewCanvasRef,
    waveformCanvasRef,
    waveformStageRef,
    seekToTrackProgress,
    seekTrackFromOverviewViewport,
    seekTrackFromViewport,
    handleOverviewPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      const nextState = buildOverviewScrubPointerState(event.pointerId);
      isOverviewScrubbingRef.current = nextState.isScrubbing;
      activeOverviewPointerIdRef.current = nextState.activePointerId;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      seekTrackFromOverviewViewport(event.clientX);
    },
    handleOverviewClick: (event: ReactMouseEvent<HTMLDivElement>) => {
      seekTrackFromOverviewViewport(event.clientX);
    },
    handleOverviewAnomalyClick: (
      marker: DeckOverviewScrubMarker,
      event: ReactMouseEvent<HTMLButtonElement>,
    ) => {
      event.stopPropagation();
      seekToTrackProgress(marker.progress);
      onSelectAnomalyForFocus(marker.id);
      if (!isConsoleExpanded) {
        onToggleConsole?.();
      }
    },
    handleOverviewAnomalyPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
    },
    handleStagePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const nextState = buildDeckScrubPointerState({
        pointerId: event.pointerId,
        clientX: event.clientX,
        left: rect.left,
        width: rect.width,
        trackWaveProgress,
      });
      isDeckScrubbingRef.current = nextState.isScrubbing;
      activeDeckPointerIdRef.current = nextState.activePointerId;
      deckScrubStartRatioRef.current = nextState.startRatio;
      deckScrubStartProgressRef.current = nextState.startProgress;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      seekTrackFromViewport(event.clientX);
    },
    handleStageClick: (event: ReactMouseEvent<HTMLDivElement>) => {
      seekTrackFromViewport(event.clientX);
    },
  };
}
