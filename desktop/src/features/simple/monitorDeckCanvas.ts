import type {
  DeckSelectedMarker,
  LogWaveOverlayPoint,
  WaveformAnomalyMarker,
} from "./monitorDeckViewModel";
import {
  resolveCurrentMonitorDeckSkin,
  resolveMonitorDeckPalette,
  withAlpha,
  type MonitorDeckVisualPreset,
} from "./monitorDeckCanvasPalette";
import {
  buildMonitorDeckLayout,
  buildMonitorOverviewLayout,
  resolveMonitorDeckCanvasSize,
} from "./monitorDeckCanvasRuntime";
import {
  drawAnomalyWash,
  drawDeckBurstRegions,
  drawPhraseRibbon,
  drawQuantizedLogBlocks,
  drawSelectedMarkerBeam,
  drawSingleSidedWaveform,
  drawTrackEnergyBand,
  drawWaveContour,
} from "./monitorDeckCanvasDrawRuntime";
export {
  resolveCurrentMonitorDeckSkin,
  resolveMonitorDeckPalette,
  type MonitorDeckPalette,
  type MonitorDeckVisualPreset,
} from "./monitorDeckCanvasPalette";

export function renderMonitorOverviewCanvas({
  canvas,
  overviewWaveSamples,
  overviewAnomalyDensity,
  anomalyBurstRegions,
  waveformAnomalies,
  selectedDeckMarker,
  visualPreset = "balanced",
}: {
  canvas: HTMLCanvasElement;
  overviewWaveSamples: number[];
  overviewAnomalyDensity: Array<{ warning: number; critical: number }>;
  anomalyBurstRegions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  waveformAnomalies: WaveformAnomalyMarker[];
  selectedDeckMarker: DeckSelectedMarker | null;
  visualPreset?: MonitorDeckVisualPreset;
}): void {
  const palette = resolveMonitorDeckPalette(visualPreset, resolveCurrentMonitorDeckSkin());
  const { width, height, dpr } = resolveMonitorDeckCanvasSize({
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  });
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const { trackFloorY, trackAmplitude, anomalyBandTop, anomalyBandHeight } =
    buildMonitorOverviewLayout(width, height);
  const baseGlow = context.createLinearGradient(0, trackFloorY - 8, 0, trackFloorY + 4);
  baseGlow.addColorStop(0, withAlpha(palette.overviewBaseGlow, 0));
  baseGlow.addColorStop(0.72, palette.overviewBaseGlow);
  baseGlow.addColorStop(1, withAlpha(palette.overviewBaseGlow, 0.04));
  context.fillStyle = baseGlow;
  context.fillRect(0, trackFloorY - 8, width, 12);

  context.fillStyle = palette.separatorLine;
  context.fillRect(0, anomalyBandTop - 2, width, 1);

  const fillGradient = context.createLinearGradient(0, 0, width, 0);
  fillGradient.addColorStop(0, palette.overviewFillStops[0] ?? palette.phraseHot);
  fillGradient.addColorStop(0.16, palette.overviewFillStops[1] ?? palette.phraseWarm);
  fillGradient.addColorStop(0.3, palette.overviewFillStops[2] ?? palette.phraseMid);
  fillGradient.addColorStop(0.5, palette.overviewFillStops[3] ?? palette.phraseWarm);
  fillGradient.addColorStop(0.68, palette.overviewFillStops[4] ?? palette.phraseCool);
  fillGradient.addColorStop(1, palette.overviewFillStops[5] ?? palette.trackTopCool);
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
    withAlpha(palette.contourStroke, 0.62),
    1,
    "top",
  );

  const densityWidth = width / Math.max(1, overviewAnomalyDensity.length);
  overviewAnomalyDensity.forEach((point, index) => {
    const x = index * densityWidth;
    if (point.warning > 0) {
      context.fillStyle = withAlpha(palette.anomalyWarn, 0.14 + point.warning * 0.32);
      context.fillRect(x, anomalyBandTop, Math.max(2, densityWidth + 1), anomalyBandHeight);
    }
    if (point.critical > 0) {
      context.fillStyle = withAlpha(palette.anomalyError, 0.16 + point.critical * 0.42);
      context.fillRect(x, anomalyBandTop, Math.max(2, densityWidth + 1), anomalyBandHeight);
    }
  });

  anomalyBurstRegions.forEach((region) => {
    const left = region.startProgress * width;
    const regionWidth = Math.max(4, (region.endProgress - region.startProgress) * width);
    context.fillStyle = region.severity >= 0.9 ? palette.burstError : palette.burstWarn;
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
      glow.addColorStop(0, withAlpha(palette.anomalyError, 0));
      glow.addColorStop(0.45, withAlpha(palette.anomalyError, 0.2));
      glow.addColorStop(0.8, withAlpha(palette.anomalyWarn, 0.24));
      glow.addColorStop(1, withAlpha(palette.anomalyError, 0));
    } else {
      glow.addColorStop(0, withAlpha(palette.anomalyWarn, 0));
      glow.addColorStop(0.45, withAlpha(palette.anomalyWarn, 0.16));
      glow.addColorStop(0.8, withAlpha(palette.anomalyWarnSoft, 0.8));
      glow.addColorStop(1, withAlpha(palette.anomalyWarn, 0));
    }
    context.fillStyle = glow;
    context.fillRect(
      x - 2,
      trackFloorY - markerHeight - 8,
      4,
      anomalyBandTop + anomalyBandHeight - (trackFloorY - markerHeight - 8),
    );

    context.fillStyle = isCritical ? palette.anomalyError : palette.anomalyWarn;
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
    beam.addColorStop(0, withAlpha(palette.playheadCore, 0));
    beam.addColorStop(0.5, palette.playheadCore);
    beam.addColorStop(1, withAlpha(palette.playheadCore, 0));
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
  visualPreset = "balanced",
}: {
  canvas: HTMLCanvasElement;
  stage: HTMLDivElement;
  trackWaveSamples: number[];
  logWaveOverlay: LogWaveOverlayPoint[];
  anomalyBurstRegions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  selectedDeckMarker: DeckSelectedMarker | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  visualPreset?: MonitorDeckVisualPreset;
}): void {
  const palette = resolveMonitorDeckPalette(visualPreset, resolveCurrentMonitorDeckSkin());
  const { width, height, dpr } = resolveMonitorDeckCanvasSize({
    width: stage.clientWidth,
    height: stage.clientHeight,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  });
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
  bgGradient.addColorStop(0, palette.backgroundTop);
  bgGradient.addColorStop(0.45, palette.backgroundMid);
  bgGradient.addColorStop(1, palette.backgroundBottom);
  context.fillStyle = bgGradient;
  context.fillRect(0, 0, width, height);

  const {
    headerInset,
    footerInset,
    deckHeight,
    trackBaseY,
    trackAmplitude,
    logBaseY,
    logAmplitude,
    separatorY,
    centerBandHeight,
  } = buildMonitorDeckLayout(width, height);

  context.fillStyle = palette.separatorLine;
  context.fillRect(0, headerInset - 1, width, 1);
  context.fillRect(0, separatorY, width, 1);

  const trackLaneGlow = context.createLinearGradient(
    0,
    trackBaseY - trackAmplitude - 10,
    0,
    trackBaseY + 8,
  );
  trackLaneGlow.addColorStop(0, withAlpha(palette.trackGlow, 0));
  trackLaneGlow.addColorStop(0.5, palette.trackGlow);
  trackLaneGlow.addColorStop(1, withAlpha(palette.trackGlow, 0.04));
  context.fillStyle = trackLaneGlow;
  context.fillRect(0, trackBaseY - trackAmplitude - 10, width, trackAmplitude + 20);

  drawTrackEnergyBand(
    context,
    trackWaveSamples,
    width,
    headerInset + deckHeight * 0.08,
    Math.max(10, deckHeight * 0.1),
    palette,
  );

  const logLaneGlow = context.createLinearGradient(
    0,
    logBaseY - logAmplitude - 12,
    0,
    logBaseY + 10,
  );
  logLaneGlow.addColorStop(0, palette.logGlowTop);
  logLaneGlow.addColorStop(0.5, palette.logGlowMid);
  logLaneGlow.addColorStop(1, palette.logGlowBottom);
  context.fillStyle = logLaneGlow;
  context.fillRect(0, logBaseY - logAmplitude - 12, width, logAmplitude + 22);

  context.fillStyle = palette.centerLine;
  context.fillRect(0, logBaseY - centerBandHeight / 2, width, centerBandHeight);

  const trackFillGradient = context.createLinearGradient(
    0,
    trackBaseY - trackAmplitude,
    0,
    trackBaseY + 2,
  );
  trackFillGradient.addColorStop(0, palette.trackTopCool);
  trackFillGradient.addColorStop(0.14, withAlpha(palette.trackTopCool, 0.9));
  trackFillGradient.addColorStop(0.52, withAlpha(palette.trackBottomCool, 0.84));
  trackFillGradient.addColorStop(1, withAlpha(palette.trackBottomCool, 0.68));
  drawPhraseRibbon(
    context,
    trackWaveSamples,
    width,
    headerInset + deckHeight * 0.31,
    Math.max(12, deckHeight * 0.12),
    palette,
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
  glossGradient.addColorStop(0, withAlpha(palette.playheadCore, 0.28));
  glossGradient.addColorStop(0.4, withAlpha(palette.playheadCore, 0.06));
  glossGradient.addColorStop(1, withAlpha(palette.playheadCore, 0.04));
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
  logLaneBed.addColorStop(0, withAlpha(palette.logWarm, 0.03));
  logLaneBed.addColorStop(0.52, withAlpha(palette.logWarm, 0.06));
  logLaneBed.addColorStop(1, withAlpha(palette.logCool, 0.12));
  context.fillStyle = logLaneBed;
  context.fillRect(0, logBaseY - logAmplitude, width, logAmplitude + 4);

  const logSamples = logWaveOverlay.map((point) =>
    Math.max(0.04, point.level * (0.2 + point.heat * 0.45)),
  );
  const logAreaGradient = context.createLinearGradient(0, logBaseY - logAmplitude, 0, logBaseY + 2);
  logAreaGradient.addColorStop(0, withAlpha(palette.logHot, 0.18));
  logAreaGradient.addColorStop(0.4, withAlpha(palette.logWarm, 0.22));
  logAreaGradient.addColorStop(1, withAlpha(palette.logCool, 0.12));
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
  drawQuantizedLogBlocks(
    context,
    logWaveOverlay,
    width,
    logBaseY,
    logAmplitude * 0.96,
    palette,
    84,
  );

  const logAccentStroke = context.createLinearGradient(
    0,
    logBaseY - logAmplitude * 0.7,
    0,
    logBaseY,
  );
  logAccentStroke.addColorStop(0, withAlpha(palette.contourStroke, 0.56));
  logAccentStroke.addColorStop(1, withAlpha(palette.logHot, 0.08));
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

  drawDeckBurstRegions({
    context,
    regions: anomalyBurstRegions,
    currentProgress: trackWaveProgress,
    width,
    logBaseY,
    logAmplitude,
    palette,
  });

  context.globalAlpha = 1;
  drawAnomalyWash(
    context,
    waveformAnomalies,
    trackWaveProgress,
    width,
    logBaseY,
    logAmplitude,
    palette,
  );
  drawSelectedMarkerBeam(
    context,
    selectedDeckMarker,
    trackWaveProgress,
    width,
    headerInset,
    height - headerInset - footerInset,
    palette,
  );

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
  context.fillStyle = withAlpha(palette.playheadCore, 0.08);
  context.fillRect(width * 0.5 - 1, headerInset, 2, height - headerInset - footerInset);

  const playheadGlow = context.createLinearGradient(width * 0.5 - 18, 0, width * 0.5 + 18, 0);
  playheadGlow.addColorStop(0, withAlpha(palette.playheadCore, 0));
  playheadGlow.addColorStop(0.45, palette.playheadGlow);
  playheadGlow.addColorStop(0.5, palette.playheadCore);
  playheadGlow.addColorStop(0.55, palette.playheadGlow);
  playheadGlow.addColorStop(1, withAlpha(palette.playheadCore, 0));
  context.fillStyle = playheadGlow;
  context.fillRect(width * 0.5 - 18, headerInset, 36, height - headerInset - footerInset);

  context.globalAlpha = 1;
}
