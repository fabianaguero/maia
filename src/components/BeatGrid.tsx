import { useEffect, useRef } from "react";
import type { BeatGrid as BeatGridType } from "../types/musical_asset";
import "../styles/beatgrid.css";

interface BeatGridProps {
  beatGrid: BeatGridType;
  duration: number;
  bpm: number;
}

export default function BeatGrid({ beatGrid, duration, bpm }: BeatGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;

    // Background
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, width, height);

    // Draw lane separators
    for (let bar = 0; bar < 8; bar++) {
      const barWidth = width / 8;
      const x = bar * barWidth;

      // Bar label
      ctx.fillStyle = "#333";
      ctx.fillRect(x, 0, 1, height);

      ctx.fillStyle = "#555";
      ctx.font = "11px monospace";
      ctx.fillText(`${bar * beatGrid.time_signature + 1}`, x + 4, 14);
    }

    // Draw beats
    beatGrid.beats.forEach((beatTime, idx) => {
      const x = (beatTime / duration) * width;
      const beatInBar = idx % beatGrid.time_signature;
      const isDownbeat = beatInBar === 0;

      ctx.strokeStyle = isDownbeat ? "#ff6b00" : "#ff6b0060";
      ctx.lineWidth = isDownbeat ? 2 : 1;

      ctx.beginPath();
      ctx.moveTo(x, isDownbeat ? 20 : 30);
      ctx.lineTo(x, height - 10);
      ctx.stroke();

      // Beat dot
      ctx.fillStyle = isDownbeat ? "#ff6b00" : "#ff6b0080";
      ctx.beginPath();
      ctx.arc(x, height - 8, isDownbeat ? 4 : 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw BPM info
    ctx.fillStyle = "#888";
    ctx.font = "12px monospace";
    ctx.fillText(`BPM: ${bpm.toFixed(2)} | Time sig: ${beatGrid.time_signature}/4 | Beats: ${beatGrid.beats.length}`, 8, height - 24);
  }, [beatGrid, duration, bpm]);

  return (
    <div className="beatgrid-container">
      <canvas
        ref={canvasRef}
        className="beatgrid-canvas"
        width={1200}
        height={200}
      />
    </div>
  );
}
