import { useEffect, useRef } from "react";
import type { BpmPoint } from "../types/musical_asset";
import "../styles/bpmcurve.css";

interface BPMCurveProps {
  bpmCurve: BpmPoint[];
  avgBpm: number;
}

export default function BPMCurve({ bpmCurve, avgBpm }: BPMCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, width, height);

    if (bpmCurve.length < 2) return;

    const bpmValues = bpmCurve.map((p) => p.bpm);
    const minBpm = Math.min(...bpmValues) - 5;
    const maxBpm = Math.max(...bpmValues) + 5;
    const bpmRange = maxBpm - minBpm;
    const maxTime = bpmCurve[bpmCurve.length - 1].time;

    const toX = (t: number) => (t / maxTime) * width;
    const toY = (bpm: number) => height - ((bpm - minBpm) / bpmRange) * (height - 40) - 20;

    // Grid lines
    const gridBpms = [minBpm, avgBpm - 5, avgBpm, avgBpm + 5, maxBpm];
    gridBpms.forEach((bpm) => {
      const y = toY(bpm);
      ctx.strokeStyle = bpm === avgBpm ? "#333" : "#1a1a1a";
      ctx.lineWidth = bpm === avgBpm ? 1.5 : 1;
      ctx.setLineDash(bpm === avgBpm ? [6, 3] : [3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.fillText(`${bpm.toFixed(1)}`, 4, y - 2);
    });

    // Average BPM label
    ctx.fillStyle = "#ffaa00";
    ctx.font = "11px monospace";
    ctx.fillText(`avg ${avgBpm.toFixed(2)} BPM`, width - 130, toY(avgBpm) - 4);

    // Curve fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(0, 212, 255, 0.4)");
    gradient.addColorStop(1, "rgba(0, 212, 255, 0.0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(toX(bpmCurve[0].time), height);
    bpmCurve.forEach((p) => ctx.lineTo(toX(p.time), toY(p.bpm)));
    ctx.lineTo(toX(bpmCurve[bpmCurve.length - 1].time), height);
    ctx.closePath();
    ctx.fill();

    // Curve line
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    bpmCurve.forEach((p, i) => {
      if (i === 0) ctx.moveTo(toX(p.time), toY(p.bpm));
      else ctx.lineTo(toX(p.time), toY(p.bpm));
    });
    ctx.stroke();
  }, [bpmCurve, avgBpm]);

  return (
    <div className="bpmcurve-container">
      <canvas
        ref={canvasRef}
        className="bpmcurve-canvas"
        width={1200}
        height={220}
      />
    </div>
  );
}
