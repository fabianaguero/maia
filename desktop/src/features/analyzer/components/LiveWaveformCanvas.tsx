import { useLiveWaveformCanvasController } from "./useLiveWaveformCanvasController";

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
  const { canvasRef } = useLiveWaveformCanvasController({
    analyserRef,
    active,
    accentColor,
    isAnomaly,
  });

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
