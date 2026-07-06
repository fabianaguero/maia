import { useCallback, useEffect, useRef, useState } from "react";

import type { MonitorContextValue } from "../features/monitor/monitorContextTypes";
import type { LibraryTrack } from "../types/library";
import { resolvePlayableTrackPath } from "../utils/track";

import {
  appendWaveHistory,
  buildHudLinesForUpdate,
  buildWaveColumn,
  drawMonitorWaveformFrame,
  MONITOR_WAVEFORM_HISTORY_SIZE,
  resolveProcessedMetrics,
  resolveSourceMetrics,
  syncMonitorWaveformCanvasSize,
  type HUDLine,
  type WaveColumn,
} from "./monitorWaveformBarRuntime";

const BAR_WIDTH = 2;
const EMPTY_WAVEFORM: number[] = [];

export function useMonitorWaveformBarController({
  monitor,
  tracks,
}: {
  monitor: MonitorContextValue;
  tracks: LibraryTrack[];
}) {
  const { audioContext, isPlayback, guideTrackPath, resumeAudio, session, subscribe } = monitor;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<WaveColumn[]>([]);
  const animRef = useRef<number>(0);
  const lastOffsetRef = useRef<number>(-1);
  const [hudLines, setHudLines] = useState<HUDLine[]>([]);
  const [latestBpm, setLatestBpm] = useState<number | null>(null);

  const hasSession = !!session;
  const currentGuideTrack = guideTrackPath
    ? (tracks.find((track) => resolvePlayableTrackPath(track) === guideTrackPath) ?? null)
    : null;
  const guideWaveform = currentGuideTrack?.analysis.waveformBins ?? EMPTY_WAVEFORM;

  useEffect(() => {
    if (!hasSession) {
      historyRef.current = [];
      setHudLines([]);
      lastOffsetRef.current = -1;
      return;
    }

    const unsubscribe = subscribe((update) => {
      if (!update) {
        return;
      }

      const sourceMetrics = resolveSourceMetrics(update);
      const processedMetrics = resolveProcessedMetrics(update.sonificationCues || [], update);

      if (update.suggestedBpm != null) {
        setLatestBpm(update.suggestedBpm);
      }

      if (update.hasData && audioContext?.state === "suspended") {
        void resumeAudio();
      }

      const { hudLines: newLines, nextOffset } = buildHudLinesForUpdate(update, {
        isPlayback,
        lastOffset: lastOffsetRef.current,
      });

      if (newLines.length > 0) {
        setHudLines((prev) => [...newLines, ...prev].slice(0, 8));
      }

      lastOffsetRef.current = nextOffset;
      historyRef.current = appendWaveHistory(
        historyRef.current,
        buildWaveColumn(update, sourceMetrics, processedMetrics),
        MONITOR_WAVEFORM_HISTORY_SIZE,
      );
    });

    return () => unsubscribe();
  }, [audioContext, hasSession, isPlayback, resumeAudio, subscribe]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const dimensions = syncMonitorWaveformCanvasSize(canvas, ctx);
    if (!dimensions) {
      return;
    }

    drawMonitorWaveformFrame({
      ctx,
      width: dimensions.width,
      height: dimensions.height,
      history: historyRef.current,
      guideWaveform,
      barWidth: BAR_WIDTH,
    });

    animRef.current = requestAnimationFrame(draw);
  }, [guideWaveform]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [draw]);

  return {
    canvasRef,
    hasSession,
    hudLines,
    latestBpm,
    isAudioSuspended: audioContext?.state === "suspended",
  };
}
