import { useCallback, useEffect, useRef } from "react";
import {
  drawLiveWaveformFrame,
  resolveLiveWaveformCanvasSize,
  sampleLiveWaveformAnalyser,
} from "./liveWaveformCanvasRuntime";

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

    const { width, height } = resolveLiveWaveformCanvasSize({
      canvas,
      context: ctx,
      dpr: window.devicePixelRatio || 1,
    });
    const { timeData, freqData } = sampleLiveWaveformAnalyser(analyser);

    drawLiveWaveformFrame({
      context: ctx,
      width,
      height,
      accentColor,
      isAnomaly,
      timeData,
      freqData,
    });

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
