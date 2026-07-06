import type { LiveMonitorDisplayLabels, MetricGridItem } from "./liveLogMonitorDisplayRuntime";

export function buildMetricGridValue(input: {
  replayActive: boolean;
  replaySessionTitle: string;
  activeAdapterLabel: string;
  audioStateLabel: string;
  styleProfileLabel: string;
  mutationProfileLabel: string;
  cueEngineStateLabel: string;
  playbackWindowLabel: string | null;
  windowsHeard: number;
  cuesEmitted: number;
  processedLines: number;
  anomaliesHeard: number;
  beatClockBpm: number | null;
  voicesEmitted: number;
  beatLooperActive: boolean;
  labels: Pick<LiveMonitorDisplayLabels, "freeLabel" | "activeLabel" | "offLabel">;
  metricId:
    | "mode"
    | "audio-engine"
    | "style-profile"
    | "mutation-profile"
    | "cue-engine"
    | "windows-heard"
    | "cues-emitted"
    | "lines-processed"
    | "anomalies-heard"
    | "beat-clock"
    | "voices-emitted"
    | "rhythm-pulse";
}): MetricGridItem["value"] {
  switch (input.metricId) {
    case "mode":
      return input.replayActive ? input.replaySessionTitle : input.activeAdapterLabel;
    case "audio-engine":
      return input.audioStateLabel;
    case "style-profile":
      return input.styleProfileLabel;
    case "mutation-profile":
      return input.mutationProfileLabel;
    case "cue-engine":
      return input.cueEngineStateLabel;
    case "windows-heard":
      return input.replayActive && input.playbackWindowLabel
        ? input.playbackWindowLabel
        : input.windowsHeard;
    case "cues-emitted":
      return input.cuesEmitted;
    case "lines-processed":
      return input.processedLines;
    case "anomalies-heard":
      return input.anomaliesHeard;
    case "beat-clock":
      return input.beatClockBpm !== null
        ? `${input.beatClockBpm.toFixed(0)} BPM`
        : input.labels.freeLabel;
    case "voices-emitted":
      return input.voicesEmitted;
    case "rhythm-pulse":
      return input.beatLooperActive ? input.labels.activeLabel : input.labels.offLabel;
  }
}
