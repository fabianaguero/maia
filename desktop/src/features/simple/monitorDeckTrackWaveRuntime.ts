import { drawSingleSidedWaveform, drawWaveContour } from "./monitorDeckCanvasDrawRuntime";
import { createVerticalGradient } from "./monitorDeckCanvasGradientRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";

export function drawMonitorDeckTrackWave(
  context: CanvasRenderingContext2D,
  state: MonitorDeckMainCanvasState,
  width: number,
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  const { palette, layout, trackWaveSamples } = state;
  const { trackBaseY, trackAmplitude } = layout;

  context.globalAlpha = 0.96;
  drawSingleSidedWaveform(
    context,
    trackWaveSamples,
    width,
    trackBaseY,
    trackAmplitude,
    createVerticalGradient(
      context,
      {
        x: 0,
        y: trackBaseY - trackAmplitude,
        width,
        height: trackAmplitude + 2,
      },
      scene.track.fillStops,
    ),
  );

  context.globalCompositeOperation = "screen";
  context.globalAlpha = 0.56;
  drawSingleSidedWaveform(
    context,
    trackWaveSamples,
    width,
    trackBaseY,
    trackAmplitude * scene.track.glossAmplitudeScale,
    createVerticalGradient(
      context,
      {
        x: 0,
        y: trackBaseY - trackAmplitude,
        width,
        height: trackAmplitude,
      },
      scene.track.glossStops,
    ),
  );
  context.globalCompositeOperation = "source-over";

  drawWaveContour(
    context,
    trackWaveSamples,
    width,
    trackBaseY,
    trackAmplitude,
    palette.contourStroke,
    1.4,
    "top",
  );
}
