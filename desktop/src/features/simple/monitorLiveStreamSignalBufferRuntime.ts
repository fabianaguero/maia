import type { LiveLogCue, LiveLogMarker } from "../../types/monitor";

import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalTypes";

export function advanceActiveLogSignalBuffer(input: {
  previous: MonitorLogSignalPoint[];
  cueBatch: LiveLogCue[];
  anomalyMarkers: LiveLogMarker[];
  reactivityMix: number;
  anomalyMix: number;
  randomValue?: number;
}): MonitorLogSignalPoint[] {
  let val = 20;
  let heat = 0;

  if (input.cueBatch.length > 0 || input.anomalyMarkers.length > 0) {
    const avgGain =
      input.cueBatch.length > 0
        ? input.cueBatch.reduce((sum, cue) => sum + (cue.gain ?? 0), 0) / input.cueBatch.length
        : 0;
    val = 20 + Math.min(120, avgGain * 150 * (0.45 + input.reactivityMix * 0.85));
    heat =
      input.anomalyMarkers.length > 0
        ? Math.min(
            1,
            (0.28 + Math.min(0.72, input.anomalyMarkers.length * 0.1)) *
              (0.35 + input.anomalyMix * 0.65),
          )
        : 0;
  } else {
    val = 24 + (input.randomValue ?? Math.random()) * (6 + input.reactivityMix * 10);
  }

  const nextBuffer = [...input.previous];
  for (let index = 0; index < 60; index += 1) {
    nextBuffer[index] = input.previous[index + 1] || { val: 20, heat: 0 };
  }
  const previousCenter = input.previous[60] || { val: 20, heat: 0 };
  nextBuffer[60] = {
    val: previousCenter.val * 0.52 + val * 0.48,
    heat: previousCenter.heat * 0.35 + heat * 0.65,
  };
  for (let index = 61; index < 120; index += 1) {
    const decay = 1 - (index - 60) / 60;
    const eased = Math.max(0, decay * decay);
    const prevFuture = input.previous[index] || { val: 20, heat: 0 };
    nextBuffer[index] = {
      val: 20 + (nextBuffer[60].val - 20) * eased * 0.52 + (prevFuture.val - 20) * 0.26,
      heat: nextBuffer[60].heat * eased * 0.62 + prevFuture.heat * 0.18,
    };
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
    const decay = 1 - (index - 60) / 60;
    const eased = Math.max(0, decay * decay);
    const future = input.previous[index] || { val: 20, heat: 0 };
    nextBuffer[index] = {
      val:
        20 +
        (nextBuffer[60].val - 20) * eased * (0.16 + input.idleMix * 0.38) +
        (future.val - 20) * (0.48 - input.idleMix * 0.2),
      heat: future.heat * (0.82 - input.idleMix * 0.18),
    };
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
    nextBuffer[index] = { val: 20, heat: 0 };
  }

  return nextBuffer;
}
