import { type MonitorDeckPalette } from "./monitorDeckCanvasPalette";
import {
  buildMonitorDeckSampleWindowMetrics,
  resolveMonitorDeckPhraseRibbonColor,
  resolveMonitorDeckTrackBandColors,
} from "./monitorDeckCanvasDrawMetricsRuntime";

export function drawPhraseRibbon(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  topY: number,
  ribbonHeight: number,
  palette: MonitorDeckPalette,
  steps = 42,
): void {
  if (samples.length === 0 || steps <= 0) {
    return;
  }

  const blockWidth = width / steps;
  for (let step = 0; step < steps; step += 1) {
    const { energy } = buildMonitorDeckSampleWindowMetrics(samples, step, steps, (avg, peak) =>
      Math.max(avg, peak * 0.82),
    );
    const x = step * blockWidth;
    const fillHeight = ribbonHeight * (0.42 + energy * 0.58);
    const y = topY + (ribbonHeight - fillHeight);

    context.fillStyle = resolveMonitorDeckPhraseRibbonColor(palette, energy);
    context.fillRect(x, y, Math.max(3, blockWidth - 1), fillHeight);
  }
}

export function drawTrackEnergyBand(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  topY: number,
  bandHeight: number,
  palette: MonitorDeckPalette,
  steps = 96,
): void {
  if (samples.length === 0 || steps <= 0) {
    return;
  }

  const blockWidth = width / steps;
  for (let step = 0; step < steps; step += 1) {
    const { energy } = buildMonitorDeckSampleWindowMetrics(samples, step, steps, (avg, peak) =>
      Math.max(avg * 0.82, peak * 0.92),
    );
    const x = step * blockWidth;
    const { colorTop, colorBottom } = resolveMonitorDeckTrackBandColors(palette, energy);

    const gradient = context.createLinearGradient(0, topY, 0, topY + bandHeight);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, colorBottom);
    context.fillStyle = gradient;
    context.fillRect(x, topY, Math.max(3, blockWidth + 0.5), bandHeight);
  }
}
