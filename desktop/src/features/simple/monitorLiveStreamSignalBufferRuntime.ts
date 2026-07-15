import type { LiveLogCue, LiveLogMarker } from "../../types/monitor";

import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalTypes";

export function advanceActiveLogSignalBuffer(input: {
  previous: MonitorLogSignalPoint[];
  cueBatch: LiveLogCue[];
  anomalyMarkers: LiveLogMarker[];
  reactivityMix: number;
  anomalyMix: number;
  lineCount?: number;
  warningCount?: number;
  errorCount?: number;
  randomValue?: number;
}): MonitorLogSignalPoint[] {
  const lineCount = input.lineCount ?? 0;
  const warningCount = input.warningCount ?? 0;
  const errorCount = input.errorCount ?? 0;
  let val = 14 + Math.min(86, lineCount * 6);
  let heat = 0;

  if (input.cueBatch.length > 0 || input.anomalyMarkers.length > 0 || lineCount > 0) {
    const avgGain =
      input.cueBatch.length > 0
        ? input.cueBatch.reduce((sum, cue) => sum + (cue.gain ?? 0), 0) / input.cueBatch.length
        : 0;
    val += Math.min(
      72,
      avgGain * 120 * (0.45 + input.reactivityMix * 0.85) +
        input.anomalyMarkers.length * 18 +
        warningCount * 10 +
        errorCount * 24,
    );
    heat =
      input.anomalyMarkers.length > 0 || warningCount > 0 || errorCount > 0
        ? Math.min(
            1,
            (0.24 +
              Math.min(
                0.76,
                errorCount * 0.34 + warningCount * 0.14 + input.anomalyMarkers.length * 0.08,
              )) *
              (0.35 + input.anomalyMix * 0.65),
          )
        : 0;
  } else {
    val += (input.randomValue ?? Math.random()) * (4 + input.reactivityMix * 7);
  }

  const nextBuffer = [...input.previous];
  for (let index = 0; index < 60; index += 1) {
    nextBuffer[index] = input.previous[index + 1] || { val: 20, heat: 0 };
  }
  const previousCenter = input.previous[60] || { val: 14, heat: 0 };
  nextBuffer[60] = {
    val: previousCenter.val * 0.2 + val * 0.8,
    heat: previousCenter.heat * 0.18 + heat * 0.82,
  };
  for (let index = 61; index < 120; index += 1) {
    nextBuffer[index] = { val: 10, heat: 0 };
  }

  return nextBuffer;
}

export function advanceIdleLogSignalBuffer(input: {
  previous: MonitorLogSignalPoint[];
  nowMs: number;
  idleMix: number;
  effectiveBpm: number | null;
}): MonitorLogSignalPoint[] {
  const idlePulse =
    18 +
    Math.sin(input.nowMs / 420) * (1 + input.idleMix * 5) +
    Math.sin(input.nowMs / 880) * (0.6 + input.idleMix * 2.8) +
    (typeof input.effectiveBpm === "number"
      ? Math.sin((input.nowMs / 60000) * input.effectiveBpm * Math.PI * 2) *
        (0.5 + input.idleMix * 2.2)
      : 0);
  const nextBuffer = [...input.previous];
  for (let index = 0; index < 60; index += 1) {
    nextBuffer[index] = input.previous[index + 1] || { val: 20, heat: 0 };
  }
  const previousCenter = input.previous[60] || { val: 20, heat: 0 };
  nextBuffer[60] = {
    val:
      previousCenter.val * (0.9 - input.idleMix * 0.22) + idlePulse * (0.1 + input.idleMix * 0.22),
    heat: previousCenter.heat * (0.82 - input.idleMix * 0.22),
  };
  for (let index = 61; index < 120; index += 1) {
    nextBuffer[index] = { val: 10, heat: 0 };
  }

  return nextBuffer;
}

export function advanceSimulatedLogSignalBuffer(
  previous: MonitorLogSignalPoint[],
  level: "info" | "warn" | "error" | "debug" | "trace",
): MonitorLogSignalPoint[] {
  const heat = level === "error" ? 1 : level === "warn" ? 0.5 : 0;
  const val = 40 + heat * 100;
  const nextBuffer = [...previous];

  for (let index = 0; index < 60; index += 1) {
    nextBuffer[index] = previous[index + 1] || { val: 20, heat: 0 };
  }

  nextBuffer[60] = { val, heat };

  for (let index = 61; index < 120; index += 1) {
    nextBuffer[index] = { val: 10, heat: 0 };
  }

  return nextBuffer;
}
