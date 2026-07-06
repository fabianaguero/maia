import type { MonitorDeckPalette } from "./monitorDeckCanvasPalette";
import {
  isMonitorDeckRelativePositionVisible,
  MONITOR_TRACK_STRIP_MULTIPLIER,
  resolveMonitorDeckRelativePosition,
  resolveMonitorDeckVisibleRange,
} from "./monitorDeckCanvasRuntime";
import type { DeckSelectedMarker, WaveformAnomalyMarker } from "./monitorDeckViewModel";

export interface MonitorDeckAnomalyWashPlan {
  markerId: string;
  severity: number;
  x: number;
  zoneWidth: number;
  zoneHeight: number;
  alpha: number;
  accentColor: string;
  glowMidColor: string;
  glowWarmColor: string;
}

export interface MonitorDeckSelectedMarkerBeamPlan {
  markerId: string;
  severity: number;
  x: number;
  beamLeft: number;
  beamWidth: number;
  lineLeft: number;
  lineWidth: number;
  glowColor: string;
  beamColor: string;
}

export interface MonitorDeckBurstRegionPlan {
  severity: number;
  visibleLeft: number;
  visibleWidth: number;
  topY: number;
  height: number;
  topColor: string;
  bottomColor: string;
}

export function buildMonitorDeckAnomalyWashPlans(input: {
  markers: WaveformAnomalyMarker[];
  currentProgress: number;
  width: number;
  amplitudeScale: number;
  palette: MonitorDeckPalette;
}): MonitorDeckAnomalyWashPlan[] {
  const { markers, currentProgress, width, amplitudeScale, palette } = input;

  return markers.flatMap((marker) => {
    const relative = resolveMonitorDeckRelativePosition(
      marker.progress,
      currentProgress,
      MONITOR_TRACK_STRIP_MULTIPLIER,
    );
    if (!isMonitorDeckRelativePositionVisible(relative)) {
      return [];
    }

    const severity = marker.severity;
    const alpha = severity >= 0.9 ? 0.26 : 0.18;

    return [
      {
        markerId: marker.id,
        severity,
        x: relative * width,
        zoneWidth: 10 + severity * 18,
        zoneHeight: amplitudeScale * (0.58 + severity * 0.22),
        alpha,
        accentColor: severity >= 0.9 ? palette.anomalyError : palette.anomalyWarn,
        glowMidColor: severity >= 0.9 ? palette.anomalyError : palette.anomalyWarn,
        glowWarmColor:
          severity >= 0.9
            ? `rgba(255,132,84,${alpha * 0.92})`
            : `rgba(255,220,112,${alpha * 0.86})`,
      },
    ];
  });
}

export function buildMonitorDeckSelectedMarkerBeamPlan(input: {
  marker: DeckSelectedMarker | null;
  currentProgress: number;
  width: number;
  palette: MonitorDeckPalette;
}): MonitorDeckSelectedMarkerBeamPlan | null {
  const { marker, currentProgress, width, palette } = input;
  if (!marker) {
    return null;
  }

  const relative = resolveMonitorDeckRelativePosition(
    marker.progress,
    currentProgress,
    MONITOR_TRACK_STRIP_MULTIPLIER,
  );
  if (!isMonitorDeckRelativePositionVisible(relative)) {
    return null;
  }

  const severity = marker.severity;
  const x = relative * width;
  return {
    markerId: marker.id,
    severity,
    x,
    beamLeft: x - 22,
    beamWidth: 44,
    lineLeft: x - 1,
    lineWidth: 2,
    glowColor: severity >= 0.9 ? palette.markerErrorGlow : palette.markerWarnGlow,
    beamColor: severity >= 0.9 ? palette.markerErrorBeam : palette.markerWarnBeam,
  };
}

export function buildMonitorDeckBurstRegionPlans(input: {
  regions: Array<{ startProgress: number; endProgress: number; severity: number }>;
  currentProgress: number;
  width: number;
  logBaseY: number;
  logAmplitude: number;
  palette: MonitorDeckPalette;
}): MonitorDeckBurstRegionPlan[] {
  const { regions, currentProgress, width, logBaseY, logAmplitude, palette } = input;

  return regions.flatMap((region) => {
    const visibleRange = resolveMonitorDeckVisibleRange({
      startProgress: region.startProgress,
      endProgress: region.endProgress,
      currentProgress,
      width,
      multiplier: MONITOR_TRACK_STRIP_MULTIPLIER,
    });
    if (!visibleRange.isVisible || visibleRange.rightX - visibleRange.leftX <= 1) {
      return [];
    }

    return [
      {
        severity: region.severity,
        visibleLeft: visibleRange.visibleLeft,
        visibleWidth: visibleRange.visibleWidth,
        topY: logBaseY - logAmplitude * 0.92,
        height: logAmplitude * 1.02,
        topColor: region.severity >= 0.9 ? palette.anomalyError : palette.anomalyWarn,
        bottomColor: region.severity >= 0.9 ? palette.anomalyErrorSoft : palette.anomalyWarnSoft,
      },
    ];
  });
}
