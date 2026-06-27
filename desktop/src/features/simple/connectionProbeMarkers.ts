import type { StreamSessionPollResult } from "../../types/monitor";

const GCLOUD_READY_MARKERS = ["Initializing tail session", "Waiting for new log lines"] as const;

const GCLOUD_ERROR_MARKERS = [
  "ERROR:",
  "You do not currently have an active account",
  "Permission denied",
  "command not found",
  "not recognized as an internal or external command",
] as const;

export function isCloudSdkNoise(line: string): boolean {
  return (
    line.includes("SyntaxWarning") && (line.includes("google-cloud-sdk") || line.includes("gcloud"))
  );
}

export function filterObservableConnectionLines(
  result: Pick<StreamSessionPollResult, "warnings" | "parsedLines">,
): string[] {
  return [...result.warnings, ...result.parsedLines].filter((line) => !isCloudSdkNoise(line));
}

export function hasCloudReadyMarker(lines: string[]): boolean {
  return lines.some((line) => GCLOUD_READY_MARKERS.some((marker) => line.includes(marker)));
}

export function findCloudProbeError(lines: string[]): string | null {
  return lines.find((line) => GCLOUD_ERROR_MARKERS.some((marker) => line.includes(marker))) ?? null;
}
