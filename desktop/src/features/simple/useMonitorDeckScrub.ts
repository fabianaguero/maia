import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import { MONITOR_TRACK_STRIP_MULTIPLIER } from "./monitorDeckCanvas";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

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
      const audio = backgroundAudioRef.current;
      const duration = audio?.duration;
      if (!audio || !duration || !Number.isFinite(duration) || duration <= 0) {
        return;
      }

      const clampedProgress = clamp01(nextProgress);
      audio.currentTime = clampedProgress * duration;
      setTrackWaveProgress(clampedProgress);
      setTrackElapsedSeconds(audio.currentTime);

      const nearestMarker = waveformAnomalies.reduce<WaveformAnomalyMarker | null>(
        (closest, marker) => {
          if (!closest) {
            return marker;
          }
          return Math.abs(marker.progress - clampedProgress) <
            Math.abs(closest.progress - clampedProgress)
            ? marker
            : closest;
        },
        null,
      );

      if (nearestMarker && Math.abs(nearestMarker.progress - clampedProgress) <= 0.03) {
        onSelectAnomalyForFocus(nearestMarker.id);
        if (!isConsoleExpanded) {
          onToggleConsole?.();
        }
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
      const pointerRatio = clamp01((clientX - rect.left) / rect.width);
      const rawDeltaRatio = pointerRatio - deckScrubStartRatioRef.current;
      const signedCurve = Math.sign(rawDeltaRatio) * Math.pow(Math.abs(rawDeltaRatio), 1.35);
      const delta = signedCurve / (MONITOR_TRACK_STRIP_MULTIPLIER * 0.82);
      const nextProgress = clamp01(deckScrubStartProgressRef.current + delta);
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
      const nextProgress = clamp01((clientX - rect.left) / rect.width);
      seekToTrackProgress(nextProgress);
    },
    [seekToTrackProgress],
  );

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (
        isOverviewScrubbingRef.current &&
        activeOverviewPointerIdRef.current !== null &&
        event.pointerId === activeOverviewPointerIdRef.current
      ) {
        seekTrackFromOverviewViewport(event.clientX);
      }

      if (
        isDeckScrubbingRef.current &&
        activeDeckPointerIdRef.current !== null &&
        event.pointerId === activeDeckPointerIdRef.current
      ) {
        seekTrackFromViewport(event.clientX);
      }
    };

    const stopScrubbing = (event: globalThis.PointerEvent) => {
      if (
        activeOverviewPointerIdRef.current !== null &&
        event.pointerId === activeOverviewPointerIdRef.current
      ) {
        isOverviewScrubbingRef.current = false;
        activeOverviewPointerIdRef.current = null;
      }

      if (
        activeDeckPointerIdRef.current !== null &&
        event.pointerId === activeDeckPointerIdRef.current
      ) {
        isDeckScrubbingRef.current = false;
        activeDeckPointerIdRef.current = null;
      }
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
      isOverviewScrubbingRef.current = true;
      activeOverviewPointerIdRef.current = event.pointerId;
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
      isDeckScrubbingRef.current = true;
      activeDeckPointerIdRef.current = event.pointerId;
      const rect = event.currentTarget.getBoundingClientRect();
      deckScrubStartRatioRef.current = clamp01((event.clientX - rect.left) / rect.width);
      deckScrubStartProgressRef.current = trackWaveProgress;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      seekTrackFromViewport(event.clientX);
    },
    handleStageClick: (event: ReactMouseEvent<HTMLDivElement>) => {
      seekTrackFromViewport(event.clientX);
    },
  };
}
