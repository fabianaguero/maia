import type {
  DeckSelectedMarker,
  LogWaveOverlayPoint,
  WaveformAnomalyMarker,
} from "./monitorDeckViewModel";

export const MONITOR_TRACK_STRIP_MULTIPLIER = 3;

function drawAnomalyWash(
  context: CanvasRenderingContext2D,
  markers: WaveformAnomalyMarker[],
  currentProgress: number,
  width: number,
  baseY: number,
  amplitudeScale: number,
): void {
  if (markers.length === 0) {
    return;
  }

  markers.forEach((marker) => {
    const relative = 0.5 + (marker.progress - currentProgress) * MONITOR_TRACK_STRIP_MULTIPLIER;
    if (relative < -0.08 || relative > 1.08) {
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
      marker.severity >= 0.9 ? `rgba(255,72,108,${alpha})` : `rgba(255,188,96,${alpha * 0.9})`,
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

    context.fillStyle = marker.severity >= 0.9 ? "rgba(255,76,110,0.54)" : "rgba(255,194,102,0.42)";
    context.fillRect(x - 1.25, baseY - zoneHeight * 0.76, 2.5, zoneHeight * 0.72);
  });
}

function drawPhraseRibbon(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  topY: number,
  ribbonHeight: number,
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

    let color = "rgba(111, 220, 255, 0.8)";
    if (energy >= 0.78) {
      color = "rgba(255, 126, 82, 0.88)";
    } else if (energy >= 0.6) {
      color = "rgba(255, 198, 82, 0.84)";
    } else if (energy >= 0.38) {
      color = "rgba(196, 255, 104, 0.82)";
    }

    context.fillStyle = color;
    context.fillRect(x, y, Math.max(3, blockWidth - 1), fillHeight);
  }
}

function drawTrackEnergyBand(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  topY: number,
  bandHeight: number,
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

    let colorTop = "rgba(124, 214, 255, 0.82)";
    let colorBottom = "rgba(72, 215, 255, 0.18)";
    if (energy >= 0.82) {
      colorTop = "rgba(255, 118, 84, 0.92)";
      colorBottom = "rgba(255, 72, 108, 0.22)";
    } else if (energy >= 0.62) {
      colorTop = "rgba(255, 198, 82, 0.9)";
      colorBottom = "rgba(255, 156, 92, 0.18)";
    } else if (energy >= 0.4) {
      colorTop = "rgba(200, 255, 108, 0.88)";
      colorBottom = "rgba(120, 198, 255, 0.16)";
    }

    const gradient = context.createLinearGradient(0, topY, 0, topY + bandHeight);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, colorBottom);
    context.fillStyle = gradient;
    context.fillRect(x, topY, Math.max(3, blockWidth + 0.5), bandHeight);
  }
}

function drawSelectedMarkerBeam(
  context: CanvasRenderingContext2D,
  marker: DeckSelectedMarker | null,
  currentProgress: number,
  width: number,
  topY: number,
  height: number,
): void {
  if (!marker) {
    return;
  }

  const relative = 0.5 + (marker.progress - currentProgress) * MONITOR_TRACK_STRIP_MULTIPLIER;
  if (relative < -0.08 || relative > 1.08) {
    return;
  }

  const x = relative * width;
  const beam = context.createLinearGradient(x - 22, topY, x + 22, topY);
  beam.addColorStop(0, "rgba(255,255,255,0)");
  beam.addColorStop(
    0.38,
    marker.severity >= 0.9 ? "rgba(255,92,124,0.16)" : "rgba(255,208,108,0.14)",
  );
  beam.addColorStop(0.5, "rgba(255,255,255,0.9)");
  beam.addColorStop(
    0.62,
    marker.severity >= 0.9 ? "rgba(255,92,124,0.16)" : "rgba(255,208,108,0.14)",
  );
  beam.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = beam;
  context.fillRect(x - 22, topY, 44, height);

  context.fillStyle = marker.severity >= 0.9 ? "rgba(255,72,108,0.88)" : "rgba(255,196,92,0.82)";
  context.fillRect(x - 1, topY, 2, height);
}

function drawQuantizedLogBlocks(
  context: CanvasRenderingContext2D,
  samples: LogWaveOverlayPoint[],
  width: number,
  baseY: number,
  amplitudeScale: number,
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
        ? "rgba(255,96,110,0.68)"
        : sample.heat >= 0.28
          ? "rgba(255,194,92,0.58)"
          : "rgba(120,198,255,0.28)";
    context.fillRect(x, baseY - height, drawWidth, height);

    if (sample.heat >= 0.68) {
      context.fillStyle = "rgba(255,232,236,0.18)";
      context.fillRect(x, baseY - height, drawWidth, Math.max(4, height * 0.45));
    }
  }
}

function drawSingleSidedWaveform(
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

function drawWaveContour(
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

export function renderMonitorOverviewCanvas({
  canvas,
  overviewWaveSamples,
  overviewAnomalyDensity,
  anomalyBurstRegions,
  waveformAnomalies,
  selectedDeckMarker,
}: {
  canvas: HTMLCanvasElement;
  overviewWaveSamples: number[];
  overviewAnomalyDensity: Array<{ warning: number; critical: number }>;
  anomalyBurstRegions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  waveformAnomalies: WaveformAnomalyMarker[];
  selectedDeckMarker: DeckSelectedMarker | null;
}): void {
  const width = Math.max(1, Math.floor(canvas.clientWidth));
  const height = Math.max(1, Math.floor(canvas.clientHeight));
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const trackFloorY = Math.max(14, height * 0.58);
  const trackAmplitude = Math.max(7, trackFloorY - 6);
  const anomalyBandTop = Math.max(trackFloorY + 3, height * 0.68);
  const anomalyBandHeight = Math.max(6, height - anomalyBandTop - 3);
  const baseGlow = context.createLinearGradient(0, trackFloorY - 8, 0, trackFloorY + 4);
  baseGlow.addColorStop(0, "rgba(72,215,255,0)");
  baseGlow.addColorStop(0.72, "rgba(72,215,255,0.18)");
  baseGlow.addColorStop(1, "rgba(72,215,255,0.04)");
  context.fillStyle = baseGlow;
  context.fillRect(0, trackFloorY - 8, width, 12);

  context.fillStyle = "rgba(255,255,255,0.05)";
  context.fillRect(0, anomalyBandTop - 2, width, 1);

  const fillGradient = context.createLinearGradient(0, 0, width, 0);
  fillGradient.addColorStop(0, "rgba(255,120,92,0.82)");
  fillGradient.addColorStop(0.16, "rgba(244,214,94,0.84)");
  fillGradient.addColorStop(0.3, "rgba(195,255,108,0.86)");
  fillGradient.addColorStop(0.5, "rgba(255,198,82,0.88)");
  fillGradient.addColorStop(0.68, "rgba(120,198,255,0.88)");
  fillGradient.addColorStop(1, "rgba(176,222,255,0.78)");
  drawSingleSidedWaveform(
    context,
    overviewWaveSamples,
    width,
    trackFloorY,
    trackAmplitude,
    fillGradient,
  );
  drawWaveContour(
    context,
    overviewWaveSamples,
    width,
    trackFloorY,
    trackAmplitude,
    "rgba(255,255,255,0.38)",
    1,
    "top",
  );

  const densityWidth = width / Math.max(1, overviewAnomalyDensity.length);
  overviewAnomalyDensity.forEach((point, index) => {
    const x = index * densityWidth;
    if (point.warning > 0) {
      context.fillStyle = `rgba(255,196,92,${0.14 + point.warning * 0.32})`;
      context.fillRect(x, anomalyBandTop, Math.max(2, densityWidth + 1), anomalyBandHeight);
    }
    if (point.critical > 0) {
      context.fillStyle = `rgba(255,72,108,${0.16 + point.critical * 0.42})`;
      context.fillRect(x, anomalyBandTop, Math.max(2, densityWidth + 1), anomalyBandHeight);
    }
  });

  anomalyBurstRegions.forEach((region) => {
    const left = region.startProgress * width;
    const regionWidth = Math.max(4, (region.endProgress - region.startProgress) * width);
    context.fillStyle = region.severity >= 0.9 ? "rgba(255,72,108,0.12)" : "rgba(255,196,92,0.1)";
    context.fillRect(left, 1, regionWidth, height - 2);
  });

  waveformAnomalies.forEach((marker) => {
    const x = marker.progress * width;
    const markerHeight = Math.max(8, 6 + marker.severity * 10);
    const isCritical = marker.severity >= 0.9;
    const glow = context.createLinearGradient(
      0,
      trackFloorY - markerHeight - 8,
      0,
      anomalyBandTop + anomalyBandHeight,
    );
    if (isCritical) {
      glow.addColorStop(0, "rgba(255,72,108,0)");
      glow.addColorStop(0.45, "rgba(255,72,108,0.2)");
      glow.addColorStop(0.8, "rgba(255,188,112,0.24)");
      glow.addColorStop(1, "rgba(255,72,108,0)");
    } else {
      glow.addColorStop(0, "rgba(255,196,92,0)");
      glow.addColorStop(0.45, "rgba(255,196,92,0.16)");
      glow.addColorStop(0.8, "rgba(255,232,164,0.2)");
      glow.addColorStop(1, "rgba(255,196,92,0)");
    }
    context.fillStyle = glow;
    context.fillRect(
      x - 2,
      trackFloorY - markerHeight - 8,
      4,
      anomalyBandTop + anomalyBandHeight - (trackFloorY - markerHeight - 8),
    );

    context.fillStyle = isCritical ? "rgba(255,72,108,0.62)" : "rgba(255,196,92,0.56)";
    context.fillRect(
      x - 1,
      trackFloorY - markerHeight,
      2,
      anomalyBandTop + anomalyBandHeight - (trackFloorY - markerHeight),
    );
  });

  if (selectedDeckMarker) {
    const x = selectedDeckMarker.progress * width;
    const beam = context.createLinearGradient(x - 12, 0, x + 12, 0);
    beam.addColorStop(0, "rgba(255,255,255,0)");
    beam.addColorStop(0.5, "rgba(255,255,255,0.9)");
    beam.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = beam;
    context.fillRect(x - 12, 0, 24, height);
  }
}

export function renderMonitorDeckCanvas({
  canvas,
  stage,
  trackWaveSamples,
  logWaveOverlay,
  anomalyBurstRegions,
  selectedDeckMarker,
  waveformAnomalies,
  trackWaveProgress,
}: {
  canvas: HTMLCanvasElement;
  stage: HTMLDivElement;
  trackWaveSamples: number[];
  logWaveOverlay: LogWaveOverlayPoint[];
  anomalyBurstRegions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  selectedDeckMarker: DeckSelectedMarker | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
}): void {
  const width = Math.max(1, Math.floor(stage.clientWidth));
  const height = Math.max(1, Math.floor(stage.clientHeight));
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const bgGradient = context.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, "rgba(9,14,19,0.98)");
  bgGradient.addColorStop(0.45, "rgba(3,6,10,0.99)");
  bgGradient.addColorStop(1, "rgba(0,0,0,1)");
  context.fillStyle = bgGradient;
  context.fillRect(0, 0, width, height);

  const headerInset = Math.max(46, height * 0.16);
  const footerInset = Math.max(10, height * 0.08);
  const deckHeight = Math.max(48, height - headerInset - footerInset);
  const trackBaseY = headerInset + deckHeight * 0.22;
  const trackAmplitude = Math.max(12, deckHeight * 0.16);
  const logBaseY = headerInset + deckHeight * 0.88;
  const logAmplitude = Math.max(18, deckHeight * 0.26);
  const separatorY = headerInset + deckHeight * 0.56;
  const centerBandHeight = Math.max(2, height * 0.012);

  context.fillStyle = "rgba(255,255,255,0.04)";
  context.fillRect(0, headerInset - 1, width, 1);
  context.fillRect(0, separatorY, width, 1);

  const trackLaneGlow = context.createLinearGradient(
    0,
    trackBaseY - trackAmplitude - 10,
    0,
    trackBaseY + 8,
  );
  trackLaneGlow.addColorStop(0, "rgba(72,215,255,0)");
  trackLaneGlow.addColorStop(0.5, "rgba(72,215,255,0.12)");
  trackLaneGlow.addColorStop(1, "rgba(72,215,255,0.04)");
  context.fillStyle = trackLaneGlow;
  context.fillRect(0, trackBaseY - trackAmplitude - 10, width, trackAmplitude + 20);

  drawTrackEnergyBand(
    context,
    trackWaveSamples,
    width,
    headerInset + deckHeight * 0.08,
    Math.max(10, deckHeight * 0.1),
  );

  const logLaneGlow = context.createLinearGradient(
    0,
    logBaseY - logAmplitude - 12,
    0,
    logBaseY + 10,
  );
  logLaneGlow.addColorStop(0, "rgba(255,176,84,0)");
  logLaneGlow.addColorStop(0.5, "rgba(255,176,84,0.08)");
  logLaneGlow.addColorStop(1, "rgba(72,215,255,0.06)");
  context.fillStyle = logLaneGlow;
  context.fillRect(0, logBaseY - logAmplitude - 12, width, logAmplitude + 22);

  context.fillStyle = "rgba(72,215,255,0.88)";
  context.fillRect(0, logBaseY - centerBandHeight / 2, width, centerBandHeight);

  const trackFillGradient = context.createLinearGradient(
    0,
    trackBaseY - trackAmplitude,
    0,
    trackBaseY + 2,
  );
  trackFillGradient.addColorStop(0, "rgba(236,246,255,0.92)");
  trackFillGradient.addColorStop(0.14, "rgba(182,223,255,0.9)");
  trackFillGradient.addColorStop(0.52, "rgba(92,188,255,0.84)");
  trackFillGradient.addColorStop(1, "rgba(34,120,196,0.68)");
  drawPhraseRibbon(
    context,
    trackWaveSamples,
    width,
    headerInset + deckHeight * 0.31,
    Math.max(12, deckHeight * 0.12),
  );
  context.globalAlpha = 0.96;
  drawSingleSidedWaveform(
    context,
    trackWaveSamples,
    width,
    trackBaseY,
    trackAmplitude,
    trackFillGradient,
  );

  const glossGradient = context.createLinearGradient(0, trackBaseY - trackAmplitude, 0, trackBaseY);
  glossGradient.addColorStop(0, "rgba(255,255,255,0.28)");
  glossGradient.addColorStop(0.4, "rgba(255,255,255,0.06)");
  glossGradient.addColorStop(1, "rgba(255,255,255,0.04)");
  context.globalCompositeOperation = "screen";
  context.globalAlpha = 0.56;
  drawSingleSidedWaveform(
    context,
    trackWaveSamples,
    width,
    trackBaseY,
    trackAmplitude * 0.9,
    glossGradient,
  );
  context.globalCompositeOperation = "source-over";

  const logLaneBed = context.createLinearGradient(0, logBaseY - logAmplitude, 0, logBaseY + 4);
  logLaneBed.addColorStop(0, "rgba(255,176,84,0.03)");
  logLaneBed.addColorStop(0.52, "rgba(255,196,92,0.06)");
  logLaneBed.addColorStop(1, "rgba(72,215,255,0.12)");
  context.fillStyle = logLaneBed;
  context.fillRect(0, logBaseY - logAmplitude, width, logAmplitude + 4);

  const logSamples = logWaveOverlay.map((point) =>
    Math.max(0.04, point.level * (0.2 + point.heat * 0.45)),
  );
  const logAreaGradient = context.createLinearGradient(0, logBaseY - logAmplitude, 0, logBaseY + 2);
  logAreaGradient.addColorStop(0, "rgba(255,104,92,0.18)");
  logAreaGradient.addColorStop(0.4, "rgba(255,188,84,0.22)");
  logAreaGradient.addColorStop(1, "rgba(120,198,255,0.12)");
  context.globalCompositeOperation = "screen";
  context.globalAlpha = 0.44;
  drawSingleSidedWaveform(
    context,
    logSamples,
    width,
    logBaseY,
    logAmplitude * 0.74,
    logAreaGradient,
  );
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 0.96;
  drawQuantizedLogBlocks(context, logWaveOverlay, width, logBaseY, logAmplitude * 0.96, 84);

  const logAccentStroke = context.createLinearGradient(
    0,
    logBaseY - logAmplitude * 0.7,
    0,
    logBaseY,
  );
  logAccentStroke.addColorStop(0, "rgba(255,238,216,0.56)");
  logAccentStroke.addColorStop(1, "rgba(255,120,92,0.08)");
  context.strokeStyle = logAccentStroke;
  context.lineWidth = 1;
  context.beginPath();
  logSamples.forEach((value, index) => {
    const x = (index / Math.max(1, logSamples.length - 1)) * width;
    const y = logBaseY - value * logAmplitude * 0.72;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();
  context.globalCompositeOperation = "source-over";

  anomalyBurstRegions.forEach((region) => {
    const leftRelative =
      0.5 + (region.startProgress - trackWaveProgress) * MONITOR_TRACK_STRIP_MULTIPLIER;
    const rightRelative =
      0.5 + (region.endProgress - trackWaveProgress) * MONITOR_TRACK_STRIP_MULTIPLIER;
    const leftX = leftRelative * width;
    const rightX = rightRelative * width;
    const burstWidth = rightX - leftX;
    if (burstWidth <= 1 || rightX < 0 || leftX > width) {
      return;
    }

    const visibleLeft = Math.max(0, leftX);
    const visibleWidth = Math.min(width, rightX) - visibleLeft;
    if (visibleWidth <= 0) {
      return;
    }

    const burstGradient = context.createLinearGradient(0, logBaseY - logAmplitude, 0, logBaseY + 2);
    if (region.severity >= 0.9) {
      burstGradient.addColorStop(0, "rgba(255,72,108,0.18)");
      burstGradient.addColorStop(1, "rgba(255,132,92,0.08)");
    } else {
      burstGradient.addColorStop(0, "rgba(255,196,92,0.16)");
      burstGradient.addColorStop(1, "rgba(255,220,132,0.06)");
    }
    context.fillStyle = burstGradient;
    context.fillRect(
      visibleLeft,
      logBaseY - logAmplitude * 0.92,
      visibleWidth,
      logAmplitude * 1.02,
    );
  });

  context.globalAlpha = 1;
  drawAnomalyWash(context, waveformAnomalies, trackWaveProgress, width, logBaseY, logAmplitude);
  drawSelectedMarkerBeam(
    context,
    selectedDeckMarker,
    trackWaveProgress,
    width,
    headerInset,
    height - headerInset - footerInset,
  );

  drawWaveContour(
    context,
    trackWaveSamples,
    width,
    trackBaseY,
    trackAmplitude,
    "rgba(238,248,255,0.64)",
    1.4,
    "top",
  );
  context.fillStyle = "rgba(255,255,255,0.08)";
  context.fillRect(width * 0.5 - 1, headerInset, 2, height - headerInset - footerInset);

  const playheadGlow = context.createLinearGradient(width * 0.5 - 18, 0, width * 0.5 + 18, 0);
  playheadGlow.addColorStop(0, "rgba(255,255,255,0)");
  playheadGlow.addColorStop(0.45, "rgba(255,255,255,0.14)");
  playheadGlow.addColorStop(0.5, "rgba(255,255,255,0.92)");
  playheadGlow.addColorStop(0.55, "rgba(255,255,255,0.14)");
  playheadGlow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = playheadGlow;
  context.fillRect(width * 0.5 - 18, headerInset, 36, height - headerInset - footerInset);

  context.globalAlpha = 1;
}
