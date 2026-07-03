import type { AppTranslations } from "../../i18n/types";
import type { MonitorMetaChipViewModel } from "./activeMonitorDeckViewModelTypes";
import { formatActiveMonitorDeckTime } from "./activeMonitorDeckTimeRuntime";

export function buildActiveMonitorMetaChips(input: {
  t: AppTranslations;
  deckPresetLabel?: string | null;
  deckBpm: number | null | undefined;
  trackElapsedSeconds: number | null;
  deckRemainingSeconds: number | null;
}): MonitorMetaChipViewModel[] {
  return [
    ...(input.deckPresetLabel
      ? [
          {
            key: "preset",
            label: `${input.t.simpleMode.monitor.presetChip} ${input.deckPresetLabel}`,
          },
        ]
      : []),
    {
      key: "bpm",
      label: `${input.t.simpleMode.monitor.bpmChip} ${
        typeof input.deckBpm === "number" ? input.deckBpm.toFixed(0) : "--"
      }`,
    },
    {
      key: "elapsed",
      label: `${input.t.simpleMode.monitor.elapsedChip} ${formatActiveMonitorDeckTime(
        input.trackElapsedSeconds,
      )}`,
    },
    {
      key: "remaining",
      label: `${input.t.simpleMode.monitor.remainingChip} -${formatActiveMonitorDeckTime(
        input.deckRemainingSeconds,
      )}`,
      subtle: true,
    },
  ];
}
