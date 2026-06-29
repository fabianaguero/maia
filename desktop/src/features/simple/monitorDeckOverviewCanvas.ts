import type { DeckSelectedMarker, WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  resolveCurrentMonitorDeckSkin,
  resolveMonitorDeckPalette,
  withAlpha,
  type MonitorDeckVisualPreset,
} from "./monitorDeckCanvasPalette";
import {
  buildMonitorOverviewLayout,
  resolveMonitorDeckCanvasSize,
} from "./monitorDeckCanvasRuntime";
import { drawSingleSidedWaveform, drawWaveContour } from "./monitorDeckCanvasDrawRuntime";

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
