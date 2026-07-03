import type { LogWaveOverlayPoint } from "./monitorDeckViewModel";
import { type MonitorDeckPalette } from "./monitorDeckCanvasPalette";
import { buildMonitorDeckQuantizedLogBlockMetrics } from "./monitorDeckCanvasDrawMetricsRuntime";

export function drawQuantizedLogBlocks(
  context: CanvasRenderingContext2D,
  samples: LogWaveOverlayPoint[],
  width: number,
  baseY: number,
  amplitudeScale: number,
  palette: MonitorDeckPalette,
  steps = 56,
): void {
  if (
    samples.length === 0 ||
    steps <= 0 ||
    !Number.isFinite(width) ||
    !Number.isFinite(baseY) ||
    !Number.isFinite(amplitudeScale)
  ) {
    return;
  }
  const blockWidth = width / steps;
  for (let step = 0; step < steps; step += 1) {
    const metrics = buildMonitorDeckQuantizedLogBlockMetrics({
      samples,
      step,
      steps,
      amplitudeScale,
      palette,
    });
    if (!metrics) {
      continue;
    }

    const x = step * blockWidth;
    const drawWidth = Math.max(2, blockWidth - 1);
    const { height, fillStyle, hasHotOverlay } = metrics;
    if (![x, drawWidth, height].every(Number.isFinite)) {
      continue;
    }

    context.fillStyle = fillStyle;
    context.fillRect(x, baseY - height, drawWidth, height);

    if (hasHotOverlay) {
      context.fillStyle = "rgba(255,232,236,0.18)";
      context.fillRect(x, baseY - height, drawWidth, Math.max(4, height * 0.45));
    }
  }
}
