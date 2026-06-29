import type {
  DeckSelectedMarker,
  LogWaveOverlayPoint,
  WaveformAnomalyMarker,
} from "./monitorDeckViewModel";
import {
  withAlpha,
  type MonitorDeckVisualPreset,
} from "./monitorDeckCanvasPalette";
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
import { buildMonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";

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
  const { palette, size, layout, logSamples } = buildMonitorDeckMainCanvasState({
    stageWidth: stage.clientWidth,
    stageHeight: stage.clientHeight,
    devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    visualPreset,
    trackWaveSamples,
    logWaveOverlay,
  });
  const { width, height, dpr } = size;
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
  } = layout;

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
