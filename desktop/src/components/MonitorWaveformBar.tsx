import { useCallback, useEffect, useRef } from "react";
import { useMonitor } from "../features/monitor/MonitorContext";
import type { LiveLogCue, LiveLogStreamUpdate, LibraryTrack } from "../types/library";
import { getTrackTitle, resolvePlayableTrackPath } from "../utils/track";

// ---------------------------------------------------------------------------
// Rekordbox-style scrolling waveform bar — always visible while monitoring.
// Shows colored frequency columns scrolling left like a DJ waveform display.
// Colors: blue=low, cyan=mid, white=high, red=anomaly accents.
// ---------------------------------------------------------------------------

/** One column of the scrolling waveform history */
interface WaveColumn {
  lowEnergy: number;   // 0-1
  midEnergy: number;   // 0-1
  highEnergy: number;  // 0-1
  anomalyHeat: number; // 0-1
  bpm: number | null;
  cueCount: number;
}

const HISTORY_SIZE = 300;
const BAR_WIDTH = 3;
const BAR_GAP = 1;

function cueToEnergy(cues: LiveLogCue[], update: LiveLogStreamUpdate): { low: number; mid: number; high: number } {
  if (cues.length === 0) return { low: 0, mid: 0, high: 0 };
  // Derive energy from log-level distribution — more musically meaningful
  const lc = update.levelCounts || {};
  const total = Math.max(1, update.lineCount);
  const errorRatio = ((lc.error || 0) + (lc.warn || 0)) / total;
  const infoRatio = (lc.info || 0) / total;
  const traceRatio = ((lc.trace || 0) + (lc.debug || 0) + (lc.unknown || 0)) / total;

  // Anomalies boost all bands
  const anomBoost = Math.min(0.4, (update.anomalyCount / total) * 2);
  // Gain-weighted average from cues
  const avgGain = cues.reduce((s, c) => s + c.gain, 0) / cues.length;
  const gainFactor = Math.min(1, avgGain * 4);

  return {
    low: Math.min(1, (errorRatio * 3 + anomBoost) * gainFactor + 0.15),
    mid: Math.min(1, (infoRatio * 3 + 0.2) * gainFactor + 0.1),
    high: Math.min(1, (traceRatio * 2 + 0.1) * gainFactor + 0.05),
  };
}

interface MonitorWaveformBarProps {
  tracks?: LibraryTrack[];
}

export function MonitorWaveformBar({ tracks = [] }: MonitorWaveformBarProps) {
  const monitor = useMonitor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<WaveColumn[]>([]);
  const animRef = useRef<number>(0);
  const activeRef = useRef(false);

  // Stable ref to subscribe — avoids re-subscribing every render
  const subscribeRef = useRef(monitor.subscribe);
  subscribeRef.current = monitor.subscribe;

  const pushColumn = useCallback((update: LiveLogStreamUpdate) => {
    if (!update.hasData) return;
    const energy = cueToEnergy(update.sonificationCues, update);
    const anomalyRatio = update.anomalyCount / Math.max(1, update.lineCount);
    const col: WaveColumn = {
      lowEnergy: energy.low,
      midEnergy: energy.mid,
      highEnergy: energy.high,
      anomalyHeat: Math.min(1, anomalyRatio * 3),
      bpm: update.suggestedBpm,
      cueCount: update.sonificationCues.length,
    };
    historyRef.current.push(col);
    if (historyRef.current.length > HISTORY_SIZE) {
      historyRef.current = historyRef.current.slice(-HISTORY_SIZE);
    }
  }, []);

  // Subscribe once on mount — stable listener, no churn
  useEffect(() => {
    return subscribeRef.current(pushColumn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushColumn]);

  // Track active state
  useEffect(() => {
    activeRef.current = !!monitor.session;
  }, [monitor.session]);

  // Render loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Background
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "rgba(0, 0, 0, 0.85)");
    bg.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Center line
    const centerY = h / 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();

    const history = historyRef.current;
    if (history.length === 0) {
      // Idle state — draw "waiting" text
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("▸ Waiting for signal", w / 2, centerY + 4);
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    // Draw columns right-to-left (newest at right, scrolling left)
    const colW = BAR_WIDTH + BAR_GAP;
    const maxCols = Math.floor(w / colW);
    const startIdx = Math.max(0, history.length - maxCols);

    for (let i = startIdx; i < history.length; i++) {
      const col = history[i];
      const x = w - (history.length - i) * colW;
      if (x < -colW) continue;

      // Each column: 3 bands drawn from center outward (mirror)
      // Low = bottom (blue), Mid = middle (cyan/green), High = top (white/magenta)
      const lowH = col.lowEnergy * (centerY * 0.9);
      const midH = col.midEnergy * (centerY * 0.7);
      const highH = col.highEnergy * (centerY * 0.5);

      // Anomaly glow
      if (col.anomalyHeat > 0.1) {
        const glowAlpha = col.anomalyHeat * 0.3;
        ctx.fillStyle = `rgba(255, 50, 50, ${glowAlpha})`;
        ctx.fillRect(x - 1, 0, BAR_WIDTH + 2, h);
      }

      // Low frequencies — blue, from center down
      const lowAlpha = 0.4 + col.lowEnergy * 0.6;
      ctx.fillStyle = `rgba(30, 90, 255, ${lowAlpha})`;
      ctx.fillRect(x, centerY, BAR_WIDTH, lowH);
      ctx.fillRect(x, centerY - lowH, BAR_WIDTH, lowH);

      // Mid frequencies — cyan/teal, layered
      const midAlpha = 0.3 + col.midEnergy * 0.7;
      ctx.fillStyle = `rgba(33, 200, 200, ${midAlpha})`;
      ctx.fillRect(x, centerY, BAR_WIDTH, midH);
      ctx.fillRect(x, centerY - midH, BAR_WIDTH, midH);

      // High frequencies — white/bright, top layer
      const hiAlpha = 0.3 + col.highEnergy * 0.7;
      ctx.fillStyle = `rgba(240, 240, 255, ${hiAlpha})`;
      ctx.fillRect(x, centerY, BAR_WIDTH, highH);
      ctx.fillRect(x, centerY - highH, BAR_WIDTH, highH);
    }

    // Playhead line (bright vertical line at the right edge)
    if (history.length > 0) {
      const playX = w - colW;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playX + BAR_WIDTH + 2, 0);
      ctx.lineTo(playX + BAR_WIDTH + 2, h);
      ctx.stroke();

      // Glow on playhead
      ctx.shadowColor = "#21b4b8";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // BPM overlay (top-right)
    const lastCol = history[history.length - 1];
    if (lastCol.bpm) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "bold 13px -apple-system, 'SF Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${lastCol.bpm} BPM`, w - 12, 18);
    }

    // Cue count (top-left)
    ctx.fillStyle = "rgba(33, 180, 184, 0.5)";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${lastCol.cueCount} cues`, 12, 18);

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  const hasSession = !!monitor.session;

  return (
    <div className={`monitor-waveform-bar${hasSession ? " monitor-waveform-bar--active" : ""}`}>
      {hasSession && (
        <div className="monitor-waveform-label">
          <span className="monitor-waveform-dot" />
          <span className="monitor-waveform-label-text">
            {monitor.isPlayback ? "PLAYBACK" : "LIVE MONITOR"}
          </span>
          <span className="monitor-waveform-label-session">
            {monitor.session!.repoTitle}
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="monitor-waveform-canvas"
      />
      {hasSession && (
        <div className="monitor-waveform-controls">
          {tracks.length > 0 && (
            <select
              className="monitor-track-select"
              value={monitor.guideTrackPath ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                monitor.setGuideTrack(val || null);
              }}
            >
              <option value="">♪ Synth</option>
              {tracks
                .map((track) => ({
                  id: track.id,
                  title: getTrackTitle(track),
                  path: resolvePlayableTrackPath(track),
                }))
                .filter((track) => track.path)
                .map((track) => (
                  <option key={track.id} value={track.path ?? ""}>
                    {track.title}
                  </option>
                ))}
            </select>
          )}
          {monitor.guideTrackPath && !monitor.guideTrackReady && (
            <span className="monitor-waveform-loading">Loading…</span>
          )}
        </div>
      )}
    </div>
  );
}
