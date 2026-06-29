import type {
  DeckSelectedMarker,
  LogWaveOverlayPoint,
  WaveformAnomalyMarker,
} from "./monitorDeckViewModel";
import { withAlpha, type MonitorDeckPalette } from "./monitorDeckCanvasPalette";
import {
  isMonitorDeckRelativePositionVisible,
  MONITOR_TRACK_STRIP_MULTIPLIER,
  resolveMonitorDeckRelativePosition,
  resolveMonitorDeckVisibleRange,
} from "./monitorDeckCanvasRuntime";

export function drawSingleSidedWaveform(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  baseY: number,
  amplitudeScale: number,
  fillStyle: CanvasGradient | string,
): void {
  if (samples.length === 0) {
    return;
  }

  const stepX = width / Math.max(1, samples.length - 1);
  context.beginPath();
  context.moveTo(0, baseY);

  samples.forEach((value, index) => {
    const x = index * stepX;
    const y = baseY - value * amplitudeScale;
    context.lineTo(x, y);
  });

  context.lineTo(width, baseY);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

export function drawWaveContour(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  centerY: number,
  amplitudeScale: number,
  strokeStyle: string,
  lineWidth: number,
  direction: "top" | "bottom",
): void {
  if (samples.length === 0) {
    return;
  }

  const stepX = width / Math.max(1, samples.length - 1);
  context.beginPath();
  samples.forEach((value, index) => {
    const x = index * stepX;
    const y =
      direction === "top" ? centerY - value * amplitudeScale : centerY + value * amplitudeScale;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

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
    const start = Math.floor((step / steps) * samples.length);
    const end = Math.max(start + 1, Math.floor(((step + 1) / steps) * samples.length));
    let sum = 0;
    let peak = 0;
    let count = 0;
    for (let index = start; index < end; index += 1) {
      const value = samples[index] ?? 0;
      sum += value;
      peak = Math.max(peak, value);
      count += 1;
    }

    const avg = count > 0 ? sum / count : 0;
    const energy = Math.max(avg, peak * 0.82);
    const x = step * blockWidth;
    const fillHeight = ribbonHeight * (0.42 + energy * 0.58);
    const y = topY + (ribbonHeight - fillHeight);

    let color = palette.phraseCool;
    if (energy >= 0.78) {
      color = palette.phraseHot;
    } else if (energy >= 0.6) {
      color = palette.phraseWarm;
    } else if (energy >= 0.38) {
      color = palette.phraseMid;
    }

    context.fillStyle = color;
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
    const start = Math.floor((step / steps) * samples.length);
    const end = Math.max(start + 1, Math.floor(((step + 1) / steps) * samples.length));
    let sum = 0;
    let peak = 0;
    let count = 0;
    for (let index = start; index < end; index += 1) {
      const value = samples[index] ?? 0;
      sum += value;
      peak = Math.max(peak, value);
      count += 1;
    }

    const avg = count > 0 ? sum / count : 0;
    const energy = Math.max(avg * 0.82, peak * 0.92);
    const x = step * blockWidth;

    let colorTop = palette.trackTopCool;
    let colorBottom = palette.trackBottomCool;
    if (energy >= 0.82) {
      colorTop = palette.trackTopHot;
      colorBottom = palette.trackBottomHot;
    } else if (energy >= 0.62) {
      colorTop = palette.trackTopWarm;
      colorBottom = palette.trackBottomWarm;
    } else if (energy >= 0.4) {
      colorTop = palette.trackTopMid;
      colorBottom = palette.trackBottomMid;
    }

    const gradient = context.createLinearGradient(0, topY, 0, topY + bandHeight);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, colorBottom);
    context.fillStyle = gradient;
    context.fillRect(x, topY, Math.max(3, blockWidth + 0.5), bandHeight);
  }
}

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
    const sampleIndex = Math.min(
      samples.length - 1,
      Math.floor((step / Math.max(1, steps - 1)) * samples.length),
    );
    const sample = samples[sampleIndex];
    if (!sample) {
      continue;
    }

    const x = step * blockWidth;
    const drawWidth = Math.max(2, blockWidth - 1);
    const height = amplitudeScale * (0.12 + Math.max(0.06, sample.level) * 0.72);
    if (![x, drawWidth, height].every(Number.isFinite)) {
      continue;
    }

    context.fillStyle =
      sample.heat >= 0.68
        ? palette.logHot
        : sample.heat >= 0.28
          ? palette.logWarm
          : palette.logCool;
    context.fillRect(x, baseY - height, drawWidth, height);

    if (sample.heat >= 0.68) {
      context.fillStyle = "rgba(255,232,236,0.18)";
      context.fillRect(x, baseY - height, drawWidth, Math.max(4, height * 0.45));
    }
  }
}

export function drawAnomalyWash(
  context: CanvasRenderingContext2D,
  markers: WaveformAnomalyMarker[],
  currentProgress: number,
  width: number,
  baseY: number,
  amplitudeScale: number,
  palette: MonitorDeckPalette,
): void {
  if (markers.length === 0) {
    return;
  }

  markers.forEach((marker) => {
    const relative = resolveMonitorDeckRelativePosition(
      marker.progress,
      currentProgress,
      MONITOR_TRACK_STRIP_MULTIPLIER,
    );
    if (!isMonitorDeckRelativePositionVisible(relative)) {
      return;
    }

    const x = relative * width;
    const zoneWidth = 10 + marker.severity * 18;
    const zoneHeight = amplitudeScale * (0.58 + marker.severity * 0.22);
    const alpha = marker.severity >= 0.9 ? 0.26 : 0.18;
    const glow = context.createLinearGradient(0, baseY - zoneHeight, 0, baseY + 2);
    glow.addColorStop(0, "rgba(255,72,108,0)");
    glow.addColorStop(
      0.32,
      marker.severity >= 0.9
        ? withAlpha(palette.anomalyError, alpha)
        : withAlpha(palette.anomalyWarn, alpha * 0.9),
    );
    glow.addColorStop(
      0.76,
      marker.severity >= 0.9
        ? `rgba(255,132,84,${alpha * 0.92})`
        : `rgba(255,220,112,${alpha * 0.86})`,
    );
    glow.addColorStop(1, "rgba(255,72,108,0)");
    context.fillStyle = glow;
    context.fillRect(x - zoneWidth / 2, baseY - zoneHeight, zoneWidth, zoneHeight + 4);

    context.fillStyle = marker.severity >= 0.9 ? palette.anomalyError : palette.anomalyWarn;
    context.fillRect(x - 1.25, baseY - zoneHeight * 0.76, 2.5, zoneHeight * 0.72);
  });
}

export function drawSelectedMarkerBeam(
  context: CanvasRenderingContext2D,
  marker: DeckSelectedMarker | null,
  currentProgress: number,
  width: number,
  topY: number,
  height: number,
  palette: MonitorDeckPalette,
): void {
  if (!marker) {
    return;
  }

  const relative = resolveMonitorDeckRelativePosition(
    marker.progress,
    currentProgress,
    MONITOR_TRACK_STRIP_MULTIPLIER,
  );
  if (!isMonitorDeckRelativePositionVisible(relative)) {
    return;
  }

  const x = relative * width;
  const beam = context.createLinearGradient(x - 22, topY, x + 22, topY);
  beam.addColorStop(0, withAlpha(palette.playheadCore, 0));
  beam.addColorStop(
    0.38,
    marker.severity >= 0.9 ? palette.markerErrorGlow : palette.markerWarnGlow,
  );
  beam.addColorStop(0.5, palette.playheadCore);
  beam.addColorStop(
    0.62,
    marker.severity >= 0.9 ? palette.markerErrorGlow : palette.markerWarnGlow,
  );
  beam.addColorStop(1, withAlpha(palette.playheadCore, 0));
  context.fillStyle = beam;
  context.fillRect(x - 22, topY, 44, height);

  context.fillStyle = marker.severity >= 0.9 ? palette.markerErrorBeam : palette.markerWarnBeam;
  context.fillRect(x - 1, topY, 2, height);
}

export function drawDeckBurstRegions(input: {
  context: CanvasRenderingContext2D;
  regions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  currentProgress: number;
  width: number;
  logBaseY: number;
  logAmplitude: number;
  palette: MonitorDeckPalette;
}): void {
  input.regions.forEach((region) => {
    const visibleRange = resolveMonitorDeckVisibleRange({
      startProgress: region.startProgress,
      endProgress: region.endProgress,
      currentProgress: input.currentProgress,
      width: input.width,
      multiplier: MONITOR_TRACK_STRIP_MULTIPLIER,
    });
    if (!visibleRange.isVisible || visibleRange.rightX - visibleRange.leftX <= 1) {
      return;
    }

    const burstGradient = input.context.createLinearGradient(
      0,
      input.logBaseY - input.logAmplitude,
      0,
      input.logBaseY + 2,
    );
    if (region.severity >= 0.9) {
      burstGradient.addColorStop(0, withAlpha(input.palette.anomalyError, 0.18));
      burstGradient.addColorStop(1, withAlpha(input.palette.anomalyErrorSoft, 0.08));
    } else {
      burstGradient.addColorStop(0, withAlpha(input.palette.anomalyWarn, 0.16));
      burstGradient.addColorStop(1, withAlpha(input.palette.anomalyWarnSoft, 0.06));
    }
    input.context.fillStyle = burstGradient;
    input.context.fillRect(
      visibleRange.visibleLeft,
      input.logBaseY - input.logAmplitude * 0.92,
      visibleRange.visibleWidth,
      input.logAmplitude * 1.02,
    );
  });
}
