import { useEffect, useRef } from "react";
import type { WaveformData, BeatInfo } from "../types/musical_asset";
import "../styles/waveform.css";

interface WaveformViewProps {
  waveform: WaveformData;
  beats: BeatInfo[];
}

export default function WaveformView({ waveform, beats }: WaveformViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const midY = height / 2;

    // Clear
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    const peaks = waveform.peaks;
    if (peaks.length === 0) return;

    const step = width / peaks.length;

    // Draw waveform gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#00d4ff");
    gradient.addColorStop(0.5, "#0099cc");
    gradient.addColorStop(1, "#00d4ff");

    ctx.fillStyle = gradient;
    ctx.beginPath();

    for (let i = 0; i < peaks.length; i++) {
      const x = i * step;
      const peakHeight = Math.abs(peaks[i]) * midY * 0.9;
      ctx.fillRect(x, midY - peakHeight, Math.max(1, step - 1), peakHeight * 2);
    }

    // Draw beat markers
    beats.forEach((beat) => {
      const x = (beat.time / waveform.duration) * width;
      const alpha = 0.3 + beat.strength * 0.7;
      ctx.strokeStyle = `rgba(255, 165, 0, ${alpha})`;
      ctx.lineWidth = beat.beat_number % 4 === 1 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });
  }, [waveform, beats]);

  return (
    <div className="waveform-container">
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        width={1200}
        height={180}
      />
      <div className="waveform-timeline">
        {Array.from({ length: 9 }).map((_, i) => {
          const t = (waveform.duration * i) / 8;
          return (
            <span key={i} style={{ left: `${(i / 8) * 100}%` }}>
              {formatTime(t)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
