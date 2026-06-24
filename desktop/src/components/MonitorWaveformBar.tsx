import { useCallback, useEffect, useRef, useState } from "react";
import { useMonitor } from "../features/monitor/MonitorContext";
import type { LiveLogCue, LiveLogStreamUpdate, LibraryTrack } from "../types/library";
import type { SourceTemplate } from "../config/sourceTemplates";
import { getTrackTitle, resolvePlayableTrackPath } from "../utils/track";

// ---------------------------------------------------------------------------
// Monitor Pro v5: Real-Time Kinetic Engine
// Fixed "fake tail" repetition using offset tracking and burst processing.
// ---------------------------------------------------------------------------

interface WaveMetrics {
  low: number;
  mid: number;
  high: number;
}

interface WaveColumn {
  source: WaveMetrics;
  processed: WaveMetrics;
  anomalyHeat: number;
  logLine: string | null;
}

interface HUDLine {
  id: string; 
  content: string;
  heat: number;
  timestamp: number;
}

const HISTORY_SIZE = 400;
const BAR_WIDTH = 2; 

function resolveSourceMetrics(update: LiveLogStreamUpdate): WaveMetrics {
  const total = update.lineCount;
  if (total === 0) return { low: 0, mid: 0, high: 0 };

  const lc = update.levelCounts || {};
  // Hyper-sensitive normalization: divisor 80 + Square Root boost
  const normalizedVolume = Math.min(1, Math.sqrt(total / 80));
  const voiceFloor = 0.15; // Ensure CH A is never totally flat if data is flowing
  
  const errorWeight = ((lc.error || 0) + (lc.warn || 0)) / total;
  
  return {
    low: Math.min(1, voiceFloor + errorWeight * 2.0 + normalizedVolume * 0.4),
    mid: Math.min(1, voiceFloor + normalizedVolume * 0.7),
    high: Math.min(1, voiceFloor + Math.random() * 0.1 + normalizedVolume * 0.3),
  };
}

function resolveProcessedMetrics(cues: LiveLogCue[], update: LiveLogStreamUpdate): WaveMetrics {
  if ((!cues || cues.length === 0) && update.anomalyMarkers.length === 0) {
    return { low: 0, mid: 0, high: 0 };
  }

  const anomalySignal = update.anomalyMarkers.length > 0 ? 0.3 + (update.anomalyMarkers.length * 0.15) : 0;
  const avgGain = (cues || []).reduce((s, c) => s + c.gain, 0) / Math.max(1, cues?.length || 0);
  // Boost weight of normal "voice" sonification (gainFactor)
  const gainFactor = Math.min(1, avgGain * 2.2);

  return {
    low: Math.min(1, (anomalySignal * 1.2) + gainFactor * 0.4 + 0.1),
    mid: Math.min(1, gainFactor * 0.9 + 0.15),
    high: Math.min(1, gainFactor * 0.6 + 0.1),
  };
}

function TemplateIndicatorChip({ template, liveBpm }: { template: SourceTemplate | null; liveBpm: number | null }) {
  if (!template) {
    return <span className="template-chip">Synth Default</span>;
  }

  const showLive = liveBpm != null && Math.abs(liveBpm - template.bpm) > 5;
  const displayText = `${template.icon} ${template.genre} · ${template.bpm} BPM${
    showLive ? ` → ${Math.round(liveBpm!)} live` : ""
  }`;

  return <span className="template-chip template-chip--active">{displayText}</span>;
}

export function MonitorWaveformBar({ tracks = [] }: { tracks?: LibraryTrack[] }) {
  const monitor = useMonitor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<WaveColumn[]>([]);
  const animRef = useRef<number>(0);
  const [hudLines, setHudLines] = useState<HUDLine[]>([]);
  const [latestBpm, setLatestBpm] = useState<number | null>(null);
  const lastOffsetRef = useRef<number>(-1);
  const hasSession = !!monitor.session;
  const currentGuideTrack =
    monitor.guideTrackPath
      ? tracks.find((track) => resolvePlayableTrackPath(track) === monitor.guideTrackPath) ?? null
      : null;
  const guideWaveform = currentGuideTrack?.analysis.waveformBins ?? [];

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
      const heat = Math.min(1, update.anomalyMarkers.length * 0.4);

      // Track the latest BPM for the template chip
      if (update.suggestedBpm != null) {
        setLatestBpm(update.suggestedBpm);
      }

      // Ensure AudioContext is alive when data flows
      if (update.hasData && monitor.audioContext?.state === "suspended") {
        void monitor.resumeAudio();
      }

      // REAL TAIL LOGIC: Only add lines if offset has progressed or if it's a replay event
      const isNewData = monitor.isPlayback || (update.toOffset > lastOffsetRef.current);
      
      if (isNewData) {
        const newLines: HUDLine[] = [];
        
        // Process bursts (all new parsed lines)
        if (update.parsedLines && update.parsedLines.length > 0) {
          update.parsedLines.forEach((content, i) => {
            newLines.push({
              id: `${update.toOffset}-${i}-${Math.random()}`,
              content,
              heat,
              timestamp: Date.now()
            });
          });
        } 
        // Fallback for anomalies if no raw lines but new offset
        else if (update.anomalyMarkers && update.anomalyMarkers.length > 0) {
           update.anomalyMarkers.forEach((marker, i) => {
             newLines.push({
               id: `anomaly-${update.toOffset}-${i}`,
               content: `[ANOMALY] ${marker.component}: ${marker.excerpt}`,
               heat: 0.8,
               timestamp: Date.now()
             });
           });
        }
        // Fallback for buffer activity
        else if (update.lineCount > 0 && !monitor.isPlayback) {
           newLines.push({
             id: `burst-${update.toOffset}`,
             content: `>> Ingesting telemetry burst: ${update.lineCount} lines`,
             heat: 0.2,
             timestamp: Date.now()
           });
        }

        if (newLines.length > 0) {
          setHudLines(prev => [...newLines.reverse(), ...prev].slice(0, 8)); // Showing up to 8 real lines
        }
        
        lastOffsetRef.current = update.toOffset;
      }

      historyRef.current.push({
        source: sourceMetrics,
        processed: processedMetrics,
        anomalyHeat: heat,
        logLine: update.parsedLines?.[0] || null,
      });
      if (historyRef.current.length > HISTORY_SIZE) historyRef.current.shift();
    });

    return () => unsubscribe();
  }, [hasSession, monitor, monitor.subscribe]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#010204";
    ctx.fillRect(0, 0, w, h);

    const halfH = h / 2;
    const trackH = halfH * 0.85;
    const history = historyRef.current;
    if (history.length === 0 && guideWaveform.length === 0) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const colW = BAR_WIDTH;
    const maxCols = Math.floor(w / colW);
    const startIdx = Math.max(0, history.length - maxCols);

    const drawOverviewBed = (
      bins: number[],
      centerY: number,
      colors: { low: string; mid: string; high: string },
    ) => {
      if (bins.length === 0) {
        return;
      }

      const usable = Math.min(bins.length, Math.max(64, Math.floor(w / 2)));
      for (let i = 0; i < usable; i++) {
        const sourceIndex = Math.floor((i / usable) * bins.length);
        const amplitude = Math.max(0.03, bins[sourceIndex] ?? 0);
        const x = (i / usable) * w;
        const lowH = amplitude * (trackH * 0.52);
        const midH = amplitude * (trackH * 0.34);
        const highH = amplitude * (trackH * 0.16);

        ctx.fillStyle = colors.low;
        ctx.fillRect(x, centerY - lowH, 1.25, lowH * 2);
        ctx.fillStyle = colors.mid;
        ctx.fillRect(x, centerY - midH, 1.25, midH * 2);
        ctx.fillStyle = colors.high;
        ctx.fillRect(x, centerY - highH, 1.25, highH * 2);
      }
    };

    const drawRekordboxWave = (
      metricsKey: 'source' | 'processed', 
      centerY: number, 
      colors: { low: string; mid: string; high: string }
    ) => {
      // 1. ANOMALY GLOW
      for (let i = startIdx; i < history.length; i++) {
        const col = history[i];
        if (col.anomalyHeat > 0.05) {
          const x = w - (history.length - i) * colW;
          ctx.fillStyle = `rgba(255, 30, 80, ${col.anomalyHeat * 0.15})`;
          ctx.fillRect(x, centerY - halfH/2, colW, halfH); 
        }
      }

      // 2. REKORDBOX STYLE RGB BARS
      for (let i = startIdx; i < history.length; i++) {
        const col = history[i];
        const x = w - (history.length - i) * colW;
        const m = col[metricsKey] as WaveMetrics;

        // Calculate heights with a little bit of jitter to make it look "alive"
        const jitterFreq = Date.now() / 60;
        const jitter = Math.sin(jitterFreq + i) * 0.1;

        const bands = [
          { h: Math.max(1, (m.low + jitter) * (trackH / 2)), c: colors.low },
          { h: Math.max(1, (m.mid - jitter) * (trackH / 2)), c: colors.mid },
          { h: Math.max(1, (m.high + jitter * 0.5) * (trackH / 2)), c: colors.high },
        ].sort((a, b) => b.h - a.h); // Draw tallest first so smaller ones are visible

        bands.forEach(b => {
          ctx.fillStyle = b.c;
          // Draw thin vertical bars for the striated waveform look
          ctx.fillRect(x, centerY - b.h, Math.max(1, colW - 0.5), b.h * 2);
        });
      }
    };

    drawOverviewBed(guideWaveform, halfH / 2, {
      low: "rgba(0, 85, 255, 0.22)",
      mid: "rgba(255, 145, 32, 0.18)",
      high: "rgba(255, 255, 255, 0.14)",
    });
    drawOverviewBed(guideWaveform, halfH + halfH / 2, {
      low: "rgba(0, 220, 255, 0.18)",
      mid: "rgba(255, 70, 125, 0.14)",
      high: "rgba(255, 255, 255, 0.1)",
    });

    drawRekordboxWave('source', halfH / 2, { 
      low: "rgba(0, 80, 255, 0.9)", // Deep blue for kicks/lows
      mid: "rgba(255, 120, 0, 0.8)", // Orange for mids/vocals
      high: "rgba(255, 255, 255, 0.9)" // White for highs/hats
    });
    drawRekordboxWave('processed', halfH + halfH / 2, { 
      low: "rgba(0, 200, 255, 0.9)", // Cyan for lows
      mid: "rgba(255, 50, 120, 0.8)", // Pink/Magenta for mids
      high: "rgba(255, 255, 255, 0.9)" // White for highs
    });

    // SCANLINE
    const scanX = (Date.now() / 20) % (w * 1.2) - (w / 5);
    const grad = ctx.createLinearGradient(scanX, 0, scanX + 60, 0);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(scanX, 0, 60, h);

    // PLAYHEAD 
    const playX = w - 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.shadowColor = "rgba(100, 200, 255, 0.5)";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0); ctx.lineTo(playX, h);
    ctx.stroke();
    ctx.shadowBlur = 0;

    animRef.current = requestAnimationFrame(draw);
  }, [guideWaveform]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  return (
    <div className={`monitor-waveform-bar${hasSession ? " monitor-waveform-bar--active" : ""}`}>
      {hasSession && (
        <div className="monitor-waveform-label monitor-pro-header">
           <div className="header-status-group">
            <span className="monitor-waveform-dot heartbeat" />
            <span className="monitor-waveform-label-text">
              {monitor.isPlayback ? "SESSION REPLAY" : "LIVE SIGNAL ENGINE"}
            </span>
            <span className="monitor-waveform-label-session" title={monitor.session!.sourcePath}>
              {monitor.session!.repoTitle}
            </span>
          </div>

          <div className="monitor-header-controls">
            {hasSession && (
              <TemplateIndicatorChip template={monitor.activeTemplate ?? null} liveBpm={latestBpm} />
            )}
            <label className="header-controls-label">LISTENING BED</label>
            <select
              className="monitor-track-select monitor-track-select--header"
              value={monitor.guideTrackPath ?? ""}
              onChange={(e) => monitor.setGuideTrack(e.target.value || null)}
            >
              <option value="">None (Maia Synth Only)</option>
              {tracks.filter(t => !!resolvePlayableTrackPath(t)).map((track) => (
                <option key={track.id} value={resolvePlayableTrackPath(track) ?? ""}>
                  {getTrackTitle(track)}
                </option>
              ))}
            </select>
            {monitor.audioContext?.state === "suspended" && (
              <button
                className="resume-audio-btn"
                onClick={() => void monitor.resumeAudio()}
                title="Resume Audio Engine"
              >
                ⏵ ENABLE AUDIO
              </button>
            )}
          </div>
        </div>
      )}
      <div className="monitor-waveform-wave-area compact-mode">
        <canvas ref={canvasRef} className="monitor-waveform-canvas" />
        <div className="wave-track-labels">
          <div className="track-label-lcd">
            <span className="lcd-tag">CH A</span>
            <span className="lcd-title">RAW TELEMETRY</span>
          </div>
          <div className="track-label-lcd">
            <span className="lcd-tag">CH B</span>
            <span className="lcd-title">SONIFIED MAPPING</span>
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
          {hudLines.length === 0 && <div className="hud-placeholder">Waiting for telemetry stream...</div>}
        </div>
      )}
    </div>
  );
}
