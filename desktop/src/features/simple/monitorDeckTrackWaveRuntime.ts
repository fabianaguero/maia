import { drawRekordboxWaveformBars, drawWaveContour } from "./monitorDeckCanvasDrawRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";

export function drawMonitorDeckTrackWave(
  context: CanvasRenderingContext2D,
  state: MonitorDeckMainCanvasState,
  width: number,
  _scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  const { palette, layout, trackWaveSamples } = state;
  const { trackBaseY, trackAmplitude } = layout;

  context.globalAlpha = 0.94;
  drawRekordboxWaveformBars({
    context,
    samples: trackWaveSamples,
    width,
    centerY: trackBaseY,
    amplitudeScale: trackAmplitude,
    lowColor: palette.trackBottomCool,
    midColor: palette.trackTopMid,
    highColor: palette.trackTopWarm,
  });

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
  drawWaveContour(
    context,
    trackWaveSamples,
    width,
    trackBaseY,
    trackAmplitude,
    palette.contourStroke,
    0.8,
    "bottom",
  );
  context.globalAlpha = 1;
}
