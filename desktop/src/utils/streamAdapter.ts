import type { StreamAdapterKind } from "../types/monitor";

const STREAM_ADAPTER_LABELS: Record<StreamAdapterKind, string> = {
  file: "File tail",
  process: "Process stdout",
  websocket: "WebSocket",
  "http-poll": "HTTP poll",
  journald: "journald",
  sonarqube: "SonarQube",
};

const DISABLED_ADAPTER_DESCRIPTION =
  "Disabled in the Week 1 MVP reduction. Use an imported log file instead.";

const STREAM_ADAPTER_DESCRIPTIONS: Record<StreamAdapterKind, string> = {
  file: "Tail the imported log file directly from disk through Maia's single supported live-analysis pipeline.",
  process: DISABLED_ADAPTER_DESCRIPTION,
  websocket: DISABLED_ADAPTER_DESCRIPTION,
  "http-poll": DISABLED_ADAPTER_DESCRIPTION,
  journald: DISABLED_ADAPTER_DESCRIPTION,
  sonarqube: "Poll SonarQube API for code quality issues and anomaly detection.",
};

export function getStreamAdapterLabel(adapterKind: StreamAdapterKind): string {
  return STREAM_ADAPTER_LABELS[adapterKind];
}

export function getStreamAdapterDescription(adapterKind: StreamAdapterKind): string {
  return STREAM_ADAPTER_DESCRIPTIONS[adapterKind];
}
