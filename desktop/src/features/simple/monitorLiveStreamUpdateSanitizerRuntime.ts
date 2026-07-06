import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { SanitizedLiveLogStreamUpdate } from "./monitorLiveStreamStateTypes";

export function sanitizeLiveLogStreamUpdate(
  update: LiveLogStreamUpdate,
): SanitizedLiveLogStreamUpdate {
  const parsedLines = Array.isArray(update.parsedLines) ? update.parsedLines : [];
  const cueBatch = Array.isArray(update.sonificationCues) ? update.sonificationCues : [];
  const anomalyMarkers = Array.isArray(update.anomalyMarkers) ? update.anomalyMarkers : [];
  const hasRealLines = parsedLines.length > 0;
  const hasRealSignals =
    (update.lineCount ?? 0) > 0 || anomalyMarkers.length > 0 || cueBatch.length > 0;

  return {
    parsedLines,
    cueBatch,
    anomalyMarkers,
    hasRealLines,
    hasRealSignals,
    hasMeaningfulUpdate: Boolean(update.hasData && (hasRealLines || hasRealSignals)),
    suggestedBpm:
      typeof update.suggestedBpm === "number" && Number.isFinite(update.suggestedBpm)
        ? update.suggestedBpm
        : null,
  };
}
