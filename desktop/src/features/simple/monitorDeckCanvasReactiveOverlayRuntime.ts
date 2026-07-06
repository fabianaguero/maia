import type { DeckSelectedMarker, WaveformAnomalyMarker } from "./monitorDeckViewModel";
import { withAlpha, type MonitorDeckPalette } from "./monitorDeckCanvasPalette";
import {
  buildMonitorDeckAnomalyWashPlans,
  buildMonitorDeckBurstRegionPlans,
  buildMonitorDeckSelectedMarkerBeamPlan,
} from "./monitorDeckCanvasOverlayRuntime";

export function drawAnomalyWash(
  context: CanvasRenderingContext2D,
  markers: WaveformAnomalyMarker[],
  currentProgress: number,
  width: number,
  baseY: number,
  amplitudeScale: number,
  palette: MonitorDeckPalette,
): void {
  buildMonitorDeckAnomalyWashPlans({
    markers,
    currentProgress,
    width,
    amplitudeScale,
    palette,
  }).forEach((plan) => {
    const glow = context.createLinearGradient(0, baseY - plan.zoneHeight, 0, baseY + 2);
    glow.addColorStop(0, "rgba(255,72,108,0)");
    glow.addColorStop(
      0.32,
      withAlpha(plan.glowMidColor, plan.severity >= 0.9 ? plan.alpha : plan.alpha * 0.9),
    );
    glow.addColorStop(0.76, plan.glowWarmColor);
    glow.addColorStop(1, "rgba(255,72,108,0)");
    context.fillStyle = glow;
    context.fillRect(
      plan.x - plan.zoneWidth / 2,
      baseY - plan.zoneHeight,
      plan.zoneWidth,
      plan.zoneHeight + 4,
    );

    context.fillStyle = plan.accentColor;
    context.fillRect(plan.x - 1.25, baseY - plan.zoneHeight * 0.76, 2.5, plan.zoneHeight * 0.72);
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
  const plan = buildMonitorDeckSelectedMarkerBeamPlan({
    marker,
    currentProgress,
    width,
    palette,
  });
  if (!plan) {
    return;
  }

  const beam = context.createLinearGradient(
    plan.beamLeft,
    topY,
    plan.beamLeft + plan.beamWidth,
    topY,
  );
  beam.addColorStop(0, withAlpha(palette.playheadCore, 0));
  beam.addColorStop(0.38, plan.glowColor);
  beam.addColorStop(0.5, palette.playheadCore);
  beam.addColorStop(0.62, plan.glowColor);
  beam.addColorStop(1, withAlpha(palette.playheadCore, 0));
  context.fillStyle = beam;
  context.fillRect(plan.beamLeft, topY, plan.beamWidth, height);

  context.fillStyle = plan.beamColor;
  context.fillRect(plan.lineLeft, topY, plan.lineWidth, height);
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
  buildMonitorDeckBurstRegionPlans({
    regions: input.regions,
    currentProgress: input.currentProgress,
    width: input.width,
    logBaseY: input.logBaseY,
    logAmplitude: input.logAmplitude,
    palette: input.palette,
  }).forEach((plan) => {
    const burstGradient = input.context.createLinearGradient(
      0,
      input.logBaseY - input.logAmplitude,
      0,
      input.logBaseY + 2,
    );
    burstGradient.addColorStop(0, withAlpha(plan.topColor, plan.severity >= 0.9 ? 0.18 : 0.16));
    burstGradient.addColorStop(1, withAlpha(plan.bottomColor, plan.severity >= 0.9 ? 0.08 : 0.06));
    input.context.fillStyle = burstGradient;
    input.context.fillRect(plan.visibleLeft, plan.topY, plan.visibleWidth, plan.height);
  });
}
