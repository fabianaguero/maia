import type { LiveMonitorDisplayLabels, MetricGridItem } from "./liveLogMonitorDisplayRuntime";
import { buildMetricGridValue } from "./liveLogMonitorMetricGridFormatRuntime";

export function buildMetricGridItems(input: {
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
  labels: Pick<
    LiveMonitorDisplayLabels,
    | "modeLabel"
    | "audioEngineLabel"
    | "styleProfileTitle"
    | "mutationProfileTitle"
    | "cueEngineLabel"
    | "windowsHeardLabel"
    | "cuesEmittedLabel"
    | "linesProcessedLabel"
    | "anomaliesHeardLabel"
    | "beatClockLabel"
    | "freeLabel"
    | "voicesEmittedLabel"
    | "rhythmPulseLabel"
    | "activeLabel"
    | "offLabel"
  >;
}): MetricGridItem[] {
  const rows: Array<{
    metricId: Parameters<typeof buildMetricGridValue>[0]["metricId"];
    label: string;
  }> = [
    { metricId: "mode", label: input.labels.modeLabel },
    { metricId: "audio-engine", label: input.labels.audioEngineLabel },
    { metricId: "style-profile", label: input.labels.styleProfileTitle },
    { metricId: "mutation-profile", label: input.labels.mutationProfileTitle },
    { metricId: "cue-engine", label: input.labels.cueEngineLabel },
    { metricId: "windows-heard", label: input.labels.windowsHeardLabel },
    { metricId: "cues-emitted", label: input.labels.cuesEmittedLabel },
    { metricId: "lines-processed", label: input.labels.linesProcessedLabel },
    { metricId: "anomalies-heard", label: input.labels.anomaliesHeardLabel },
    { metricId: "beat-clock", label: input.labels.beatClockLabel },
    { metricId: "voices-emitted", label: input.labels.voicesEmittedLabel },
    { metricId: "rhythm-pulse", label: input.labels.rhythmPulseLabel },
  ];

  return rows.map((row) => ({
    label: row.label,
    value: buildMetricGridValue({
      ...input,
      metricId: row.metricId,
      labels: {
        freeLabel: input.labels.freeLabel,
        activeLabel: input.labels.activeLabel,
        offLabel: input.labels.offLabel,
      },
    }),
  }));
}
