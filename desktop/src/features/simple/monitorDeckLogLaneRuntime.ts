import { drawRekordboxWaveformBars, drawSingleSidedWaveform } from "./monitorDeckCanvasDrawRuntime";
import {
  createVerticalGradient,
  fillVerticalGradientRect,
} from "./monitorDeckCanvasGradientRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";

function drawMonitorDeckLogContour(
  context: CanvasRenderingContext2D,
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  context.strokeStyle = createVerticalGradient(context, scene.log.bedRect, scene.log.contourStops);
  context.lineWidth = 1;
  context.beginPath();
  scene.log.contourPoints.forEach(({ x, y }, index) => {
    if (index === 0) {
      context.moveTo(x, y);
      return;
    }
    context.lineTo(x, y);
  });
  context.stroke();
}

export function drawMonitorDeckLogLane(
  context: CanvasRenderingContext2D,
  state: MonitorDeckMainCanvasState,
  width: number,
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  const { palette, layout, logSamples, logWaveOverlay } = state;
  const { logBaseY, logAmplitude } = layout;

  fillVerticalGradientRect(context, scene.log.glowRect, scene.log.glowStops);
  fillVerticalGradientRect(context, scene.log.bedRect, scene.log.bedStops);

  context.globalCompositeOperation = "screen";
  context.globalAlpha = 0.9;
  drawSingleSidedWaveform(
    context,
    logSamples,
    width,
    logBaseY,
    logAmplitude * scene.log.waveformAmplitudeScale,
    createVerticalGradient(context, scene.log.bedRect, scene.log.waveformStops),
  );
  context.globalAlpha = 0.58;
  drawRekordboxWaveformBars({
    context,
    samples: logSamples,
    width,
    centerY: logBaseY,
    amplitudeScale: logAmplitude * scene.log.waveformAmplitudeScale,
    lowColor: palette.logCool,
    midColor: palette.logWarm,
    highColor: palette.logHot,
    symmetric: false,
  });
  const anomalyHeatSamples = logWaveOverlay.map((point) => point.level * point.heat);
  context.globalAlpha = 0.72;
  drawSingleSidedWaveform(
    context,
    anomalyHeatSamples,
    width,
    logBaseY,
    logAmplitude,
    palette.logHot,
  );
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;

  drawMonitorDeckLogContour(context, scene);
}
