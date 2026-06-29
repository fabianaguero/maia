import { useCallback, useEffect, useRef, useState } from "react";
import { useMonitor } from "../features/monitor/MonitorContext";
import type { LibraryTrack } from "../types/library";
import type { SourceTemplate } from "../config/sourceTemplates";
import { resolveSourceTemplatePresentation } from "../config/sourceTemplates";
import { useT } from "../i18n/I18nContext";
import { getTrackTitle, resolvePlayableTrackPath } from "../utils/track";
import {
  appendWaveHistory,
  buildHudLinesForUpdate,
  drawMonitorWaveformFrame,
  buildWaveColumn,
  type HUDLine,
  MONITOR_WAVEFORM_HISTORY_SIZE,
  resolveProcessedMetrics,
  resolveSourceMetrics,
  syncMonitorWaveformCanvasSize,
  type WaveColumn,
} from "./monitorWaveformBarRuntime";

// ---------------------------------------------------------------------------
// Monitor Pro v5: Real-Time Kinetic Engine
// Fixed "fake tail" repetition using offset tracking and burst processing.
// ---------------------------------------------------------------------------

const BAR_WIDTH = 2;
const EMPTY_WAVEFORM: number[] = [];

function TemplateIndicatorChip({
  template,
  liveBpm,
}: {
  template: SourceTemplate | null;
  liveBpm: number | null;
}) {
  const t = useT();
  if (!template) {
    return <span className="template-chip">{t.simpleMode.monitor.synthDefault}</span>;
  }

  const presentation = resolveSourceTemplatePresentation(template, t);
  const showLive = liveBpm != null && Math.abs(liveBpm - template.bpm) > 5;
  const displayText = `${template.icon} ${presentation?.genre ?? template.genre} · ${template.bpm} BPM${
    showLive
      ? ` ${t.simpleMode.monitor.liveTempoShift.replace("{bpm}", String(Math.round(liveBpm!)))}`
      : ""
  }`;

  return <span className="template-chip template-chip--active">{displayText}</span>;
}

export function MonitorWaveformBar({ tracks = [] }: { tracks?: LibraryTrack[] }) {
  const t = useT();
  const monitor = useMonitor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<WaveColumn[]>([]);
  const animRef = useRef<number>(0);
  const [hudLines, setHudLines] = useState<HUDLine[]>([]);
  const [latestBpm, setLatestBpm] = useState<number | null>(null);
  const lastOffsetRef = useRef<number>(-1);
  const hasSession = !!monitor.session;
  const currentGuideTrack = monitor.guideTrackPath
    ? (tracks.find((track) => resolvePlayableTrackPath(track) === monitor.guideTrackPath) ?? null)
    : null;
  const guideWaveform = currentGuideTrack?.analysis.waveformBins ?? EMPTY_WAVEFORM;

  useEffect(() => {
    if (!hasSession) {
      historyRef.current = [];
      setHudLines([]);
      lastOffsetRef.current = -1;
      return;
    }

    const unsubscribe = monitor.subscribe((update) => {
      if (!update) return;

      const sourceMetrics = resolveSourceMetrics(update);
      const processedMetrics = resolveProcessedMetrics(update.sonificationCues || [], update);

      // Track the latest BPM for the template chip
      if (update.suggestedBpm != null) {
        setLatestBpm(update.suggestedBpm);
      }

      // Ensure AudioContext is alive when data flows
      if (update.hasData && monitor.audioContext?.state === "suspended") {
        void monitor.resumeAudio();
      }

      // REAL TAIL LOGIC: Only add lines if offset has progressed or if it's a replay event
      const { hudLines: newLines, nextOffset } = buildHudLinesForUpdate(update, {
        isPlayback: monitor.isPlayback,
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
  }, [hasSession, monitor, monitor.subscribe]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dimensions = syncMonitorWaveformCanvasSize(canvas, ctx);
    if (!dimensions) {
      return;
    }

    const hasSignal = drawMonitorWaveformFrame({
      ctx,
      width: dimensions.width,
      height: dimensions.height,
      history: historyRef.current,
      guideWaveform,
      barWidth: BAR_WIDTH,
    });

    if (!hasSignal) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    animRef.current = requestAnimationFrame(draw);
  }, [guideWaveform]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <div className={`monitor-waveform-bar${hasSession ? " monitor-waveform-bar--active" : ""}`}>
      {hasSession && (
        <div className="monitor-waveform-label monitor-pro-header">
          <div className="header-status-group">
            <span className="monitor-waveform-dot heartbeat" />
            <span className="monitor-waveform-label-text">
              {monitor.isPlayback
                ? t.simpleMode.monitor.sessionReplay
                : t.simpleMode.monitor.liveSignalEngine}
            </span>
            <span className="monitor-waveform-label-session" title={monitor.session!.sourcePath}>
              {monitor.session!.repoTitle}
            </span>
          </div>

          <div className="monitor-header-controls">
            {hasSession && (
              <TemplateIndicatorChip
                template={monitor.activeTemplate ?? null}
                liveBpm={latestBpm}
              />
            )}
            <label className="header-controls-label">{t.simpleMode.monitor.listeningBed}</label>
            <select
              className="monitor-track-select monitor-track-select--header"
              value={monitor.guideTrackPath ?? ""}
              onChange={(e) => monitor.setGuideTrack(e.target.value || null)}
            >
              <option value="">{t.simpleMode.monitor.noListeningBed}</option>
              {tracks
                .filter((t) => !!resolvePlayableTrackPath(t))
                .map((track) => (
                  <option key={track.id} value={resolvePlayableTrackPath(track) ?? ""}>
                    {getTrackTitle(track)}
                  </option>
                ))}
            </select>
            {monitor.audioContext?.state === "suspended" && (
              <button
                className="resume-audio-btn"
                onClick={() => void monitor.resumeAudio()}
                title={t.simpleMode.monitor.resumeAudioTitle}
              >
                ⏵ {t.simpleMode.monitor.enableAudio}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="monitor-waveform-wave-area compact-mode">
        <canvas ref={canvasRef} className="monitor-waveform-canvas" />
        <div className="wave-track-labels">
          <div className="track-label-lcd">
            <span className="lcd-tag" title={t.simpleMode.monitor.channelATitle}>
              {t.simpleMode.monitor.channelATag}
            </span>
            <span className="lcd-title">{t.simpleMode.monitor.rawTelemetry}</span>
          </div>
          <div className="track-label-lcd">
            <span className="lcd-tag" title={t.simpleMode.monitor.channelBTitle}>
              {t.simpleMode.monitor.channelBTag}
            </span>
            <span className="lcd-title">{t.simpleMode.monitor.sonifiedMapping}</span>
          </div>
        </div>
      </div>

      {hasSession && (
        <div className="monitor-waveform-tail-hud compact kinetic-tail real-tail">
          {hudLines.map((line) => (
            <div
              key={line.id}
              className={`monitor-waveform-tail-line${line.heat > 0.3 ? " is-anomaly" : ""}`}
            >
              <span className="line-bullet">⏵</span>
              <span className="line-content">{line.content}</span>
            </div>
          ))}
          {hudLines.length === 0 && (
            <div className="hud-placeholder">{t.simpleMode.monitor.waitingTelemetryStream}</div>
          )}
        </div>
      )}
    </div>
  );
}
