import type { LiveMonitorDisplayLabels, SampleEngineStatus } from "./liveLogMonitorDisplayRuntime";

export function resolveCueEngineStateLabel(input: {
  sampleStatus: SampleEngineStatus;
  sampleSourceCount: number;
  labels: Pick<
    LiveMonitorDisplayLabels,
    | "cueEngineBaseSamplePack"
    | "cueEngineBaseSample"
    | "cueEngineLoadingSample"
    | "cueEngineInternalSynth"
  >;
}): string {
  if (input.sampleStatus === "ready") {
    return input.sampleSourceCount > 1
      ? input.labels.cueEngineBaseSamplePack
      : input.labels.cueEngineBaseSample;
  }

  if (input.sampleStatus === "loading") {
    return input.labels.cueEngineLoadingSample;
  }

  return input.labels.cueEngineInternalSynth;
}

export function resolveBounceActionLabel(
  bounceWindowCount: number,
  bounceWindowSeconds: number,
): { label: string; title: string } | null {
  if (bounceWindowCount <= 0) {
    return null;
  }

  const secondsLabel = (bounceWindowCount * bounceWindowSeconds).toFixed(0);

  return {
    label: `↓ Bounce ${secondsLabel}s`,
    title: `Bounce ${secondsLabel}s of session audio to WAV`,
  };
}
