import { useCallback, useEffect, useRef } from "react";

interface LiveWaveformCanvasProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  active: boolean;
  accentColor?: string;
  isAnomaly?: boolean;
}

export function LiveWaveformCanvas({
  analyserRef,
  active,
  accentColor = "#21b4b8",
  isAnomaly = false,
}: LiveWaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || !active) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    const bufLen = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufLen);
    const freqData = new Uint8Array(bufLen);
    analyser.getByteTimeDomainData(timeData);
    analyser.getByteFrequencyData(freqData);

    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (isAnomaly) {
      bgGrad.addColorStop(0, "rgba(244, 63, 94, 0.4)");
      bgGrad.addColorStop(1, "rgba(244, 63, 94, 0.1)");
    } else {
      bgGrad.addColorStop(0, "rgba(0, 0, 0, 0.3)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0.05)");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const barCount = 64;
    const barWidth = width / barCount;
    const step = Math.floor(bufLen / barCount);
    for (let index = 0; index < barCount; index += 1) {
      const value = freqData[index * step] / 255;
      const barHeight = value * height * 0.8;
      const alpha = 0.15 + value * 0.3;
      ctx.fillStyle = `rgba(33, 180, 184, ${alpha})`;
      ctx.fillRect(index * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
    }

    ctx.beginPath();
    ctx.lineWidth = 2;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, `${accentColor}88`);
    gradient.addColorStop(0.5, accentColor);
    gradient.addColorStop(1, `${accentColor}88`);
    ctx.strokeStyle = gradient;

    const sliceWidth = width / bufLen;
    let x = 0;
    for (let index = 0; index < bufLen; index += 1) {
      const value = timeData[index] / 128;
      const y = (value * height) / 2;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.shadowColor = isAnomaly ? "#f43f5e" : accentColor;
    ctx.shadowBlur = isAnomaly ? 24 : 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = isAnomaly ? "rgba(244, 63, 94, 0.4)" : "rgba(244, 242, 233, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [active, accentColor, analyserRef, isAnomaly]);

  useEffect(() => {
    if (active) {
      animFrameRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [active, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="live-waveform-canvas"
      style={{
        width: "100%",
        height: "128px",
        borderRadius: "14px",
        display: "block",
      }}
    />
  );
}
