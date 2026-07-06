import type { AppTranslations } from "../../../i18n/types";
import type { LiveLogStreamUpdate } from "../../../types/library";
import type { MetricGridItem } from "./liveLogMonitorDisplayRuntime";
import { formatConfidence, formatCursor, levelCount } from "./liveLogMonitorPanelRuntime";

export function buildLiveLogMonitorWindowMetricGridItems(input: {
  t: AppTranslations;
  lastUpdate: LiveLogStreamUpdate | null;
  repositorySuggestedBpm: number | null;
  currentLevelCounts: Record<string, number>;
}): MetricGridItem[] {
  if (!input.lastUpdate) {
    return [];
  }

  return [
    {
      label: input.t.inspect.suggestedBpm,
      value:
        typeof input.lastUpdate.suggestedBpm === "number"
          ? input.lastUpdate.suggestedBpm.toFixed(0)
          : (input.repositorySuggestedBpm?.toFixed(0) ?? input.t.inspect.pending),
    },
    {
      label: input.t.session.confidence,
      value: formatConfidence(input.lastUpdate.confidence),
    },
    {
      label: input.t.session.dominantLevel,
      value: input.lastUpdate.dominantLevel,
    },
    {
      label: input.t.inspect.chunkLines,
      value: String(input.lastUpdate.lineCount),
    },
    {
      label: input.t.inspect.errors,
      value: String(levelCount(input.currentLevelCounts, "error")),
    },
    {
      label: input.t.inspect.warnings,
      value: String(levelCount(input.currentLevelCounts, "warn")),
    },
    {
      label: input.t.inspect.info,
      value: String(levelCount(input.currentLevelCounts, "info")),
    },
    {
      label: input.t.inspect.tailWindow,
      value: `${formatCursor(input.lastUpdate.fromOffset)} -> ${formatCursor(input.lastUpdate.toOffset)}`,
    },
  ];
}
