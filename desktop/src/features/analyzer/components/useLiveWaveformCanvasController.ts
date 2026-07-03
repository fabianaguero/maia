import { useCallback, useEffect, useRef } from "react";

import {
  drawLiveWaveformFrame,
  resolveLiveWaveformCanvasSize,
  sampleLiveWaveformAnalyser,
} from "./liveWaveformCanvasRuntime";

interface UseLiveWaveformCanvasControllerInput {
  analyserRef: React.RefObject<AnalyserNode | null>;
  active: boolean;
  accentColor: string;
  isAnomaly: boolean;
}

export function useLiveWaveformCanvasController({
  analyserRef,
  active,
  accentColor,
  isAnomaly,
}: UseLiveWaveformCanvasControllerInput) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || !active) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const { width, height } = resolveLiveWaveformCanvasSize({
      canvas,
      context,
      dpr: window.devicePixelRatio || 1,
    });
    const { timeData, freqData } = sampleLiveWaveformAnalyser(analyser);

    drawLiveWaveformFrame({
      context,
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

  return {
    canvasRef,
  };
}
