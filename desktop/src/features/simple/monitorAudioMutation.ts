import type { LiveLogMarker } from "../../types/library";

export interface MonitorTrackMutationInput {
  lineCount?: number;
  anomalyCount?: number;
  levelCounts?: Record<string, number>;
  anomalyMarkers?: LiveLogMarker[];
}

export interface MonitorTrackMutationPlan {
  mode: "neutral" | "alert";
  nextPressure: number;
  burstFactor: number;
  filterHz: number;
  filterQ: number;
  outputGain: number;
  dryGain: number;
  driveWet: number;
  deckGain: number;
  driveCurveAmount: number;
  playbackRate: number;
  sustainedBurst: boolean;
  recoverAtOffsetSec: number;
  transitionSec: number;
  gateFloor: number | null;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

export function resolveBurstFactor(markers: LiveLogMarker[] | undefined): number {
  if (!markers || markers.length === 0) {
    return 0;
  }

  const sorted = [...markers].sort((left, right) => left.eventIndex - right.eventIndex);
  let groupedPairs = 0;
  let criticalCount = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const marker = sorted[index]!;
    if ((marker.level || "").toLowerCase() === "error") {
      criticalCount += 1;
    }

    const next = sorted[index + 1];
    if (next && next.eventIndex - marker.eventIndex <= 3) {
      groupedPairs += 1;
    }
  }

  const density =
    sorted.length / Math.max(4, sorted[sorted.length - 1]!.eventIndex - sorted[0]!.eventIndex + 1);
  const clustering = groupedPairs / Math.max(1, sorted.length - 1);
  const severity = criticalCount / Math.max(1, sorted.length);
  return clamp01(density * 0.25 + clustering * 0.45 + severity * 0.3);
}

export function buildMonitorTrackMutationPlan(
  update: MonitorTrackMutationInput,
  previousPressure: number,
): MonitorTrackMutationPlan {
  const lineCount = Math.max(1, update.lineCount ?? 0);
  const levelCounts = update.levelCounts ?? {};
  const warnCount = levelCounts.WARN ?? levelCounts.warn ?? 0;
  const errorCount = levelCounts.ERROR ?? levelCounts.error ?? 0;
  const burstFactor = resolveBurstFactor(update.anomalyMarkers);
  const anomalyRatio = clamp01((update.anomalyCount ?? 0) / lineCount);
  const severityRatio = clamp01((warnCount * 0.45 + errorCount) / lineCount);
  const hasAlertSignal =
    (update.anomalyCount ?? 0) > 0 || warnCount > 0 || errorCount > 0 || burstFactor > 0.18;

  if (!hasAlertSignal) {
    return {
      mode: "neutral",
      nextPressure: previousPressure * 0.58,
      burstFactor,
      filterHz: 18000,
      filterQ: 1,
      outputGain: 0.82,
      dryGain: 1,
      driveWet: 0.0001,
      deckGain: 1,
      driveCurveAmount: 1.02,
      playbackRate: 1,
      sustainedBurst: false,
      recoverAtOffsetSec: 0.22,
      transitionSec: 0.18,
      gateFloor: null,
    };
  }

  const instantPressure = clamp01(anomalyRatio * 0.58 + severityRatio * 0.26 + burstFactor * 0.24);
  const pressure = clamp01(previousPressure * 0.84 + instantPressure * 0.16);
  const sustainedBurst = burstFactor > 0.46;
  const filterHz = Math.max(7600, 21000 - (2800 * pressure + burstFactor * 2800));
  const filterQ = 0.7 + pressure * 0.42 + burstFactor * 0.3;
  const outputGain = Math.max(0.84, 0.93 - pressure * 0.028 - burstFactor * 0.018);
  const driveWet =
    pressure > 0.4 ? clamp01((pressure - 0.4) * 0.08 + burstFactor * 0.06) : burstFactor * 0.04;
  const deckGain = Math.max(0.955, 1 - pressure * 0.015 - burstFactor * 0.01);
  const gateFloor =
    pressure > 0.95 && errorCount > 3 && burstFactor < 0.72
      ? Math.max(0.955, deckGain * (1 - Math.min(0.035, 0.008 + pressure * 0.016)))
      : null;

  return {
    mode: "alert",
    nextPressure: pressure,
    burstFactor,
    filterHz,
    filterQ,
    outputGain,
    dryGain: Math.max(0.92, 1 - driveWet * 0.08),
    driveWet: Math.max(0.0001, driveWet),
    deckGain,
    driveCurveAmount: 1.02 + driveWet * 0.85 + burstFactor * 0.22,
    playbackRate: 1,
    sustainedBurst,
    recoverAtOffsetSec: 2.6 + burstFactor * 1.8,
    transitionSec: sustainedBurst ? 0.38 : 0.26,
    gateFloor,
  };
}
