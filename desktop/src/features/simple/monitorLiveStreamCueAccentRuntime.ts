import type { LiveLogCue, LiveLogStreamUpdate } from "../../types/monitor";

import { resolveBurstFactor } from "./monitorAudioMutation";
import type { MonitorDeckControls } from "./monitorDeckControls";

export function shouldEmitMonitorCueAccent(input: {
  update: Pick<
    LiveLogStreamUpdate,
    "lineCount" | "anomalyCount" | "levelCounts" | "anomalyMarkers"
  >;
  cueBatch: LiveLogCue[];
  controls: MonitorDeckControls;
  hasMeaningfulUpdate: boolean;
  hasBackgroundTrack: boolean;
  lastCueAccentAtMs: number;
  nowMs: number;
}): boolean {
  const {
    update,
    cueBatch,
    controls,
    hasMeaningfulUpdate,
    hasBackgroundTrack,
    lastCueAccentAtMs,
    nowMs,
  } = input;
  const reactivityMix = controls.reactivity / 100;
  const anomalyMix = controls.anomalyEmphasis / 100;
  const lineCount = Math.max(1, update.lineCount ?? 0);
  const anomalyPressure = Math.max(
    (update.anomalyCount ?? 0) / lineCount,
    ((update.levelCounts?.ERROR ?? update.levelCounts?.error ?? 0) +
      (update.levelCounts?.WARN ?? update.levelCounts?.warn ?? 0) * 0.4) /
      lineCount,
  );
  const burstFactor = resolveBurstFactor(update.anomalyMarkers);
  const anomalyDrivenCue =
    cueBatch.find((cue) => cue.accent === "anomaly") ??
    cueBatch.find((cue) => (cue.gain ?? 0) >= 0.12) ??
    null;
  const anomalyPressureThreshold = 0.38 - anomalyMix * 0.2;
  const burstSuppressionThreshold = 0.8 - reactivityMix * 0.12;

  return Boolean(
    hasMeaningfulUpdate &&
    anomalyPressure >= anomalyPressureThreshold &&
    burstFactor < burstSuppressionThreshold &&
    anomalyDrivenCue &&
    (!hasBackgroundTrack || nowMs - lastCueAccentAtMs >= controls.cueCooldownMs),
  );
}
