import { drawQuantizedLogBlocks, drawSingleSidedWaveform } from "./monitorDeckCanvasDrawRuntime";
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
  context.globalAlpha = 0.4;
  drawSingleSidedWaveform(
    context,
    logSamples,
    width,
    logBaseY,
    logAmplitude * scene.log.waveformAmplitudeScale,
    createVerticalGradient(context, scene.log.bedRect, scene.log.waveformStops),
  );
  context.globalCompositeOperation = "source-over";
  // Increase alpha for quantized blocks to make log stream more visible and clearly linked to tail
  context.globalAlpha = 1;

  drawQuantizedLogBlocks(
    context,
    logWaveOverlay,
    width,
    logBaseY,
    logAmplitude * scene.log.quantizedBlockAmplitudeScale,
    palette,
    84,
  );

  drawMonitorDeckLogContour(context, scene);
}
