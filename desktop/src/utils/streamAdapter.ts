import type { StreamAdapterKind } from "../types/library";

export function getStreamAdapterLabel(adapterKind: StreamAdapterKind): string {
  switch (adapterKind) {
    case "process":
      return "Process stdout";
    case "websocket":
      return "WebSocket";
    case "http-poll":
      return "HTTP poll";
    case "journald":
      return "journald";
    case "file":
    default:
      return "File tail";
  }
}

export function getStreamAdapterDescription(adapterKind: StreamAdapterKind): string {
  switch (adapterKind) {
    case "process":
      return "Disabled in the Week 1 MVP reduction. Use an imported log file instead.";
    case "websocket":
      return "Disabled in the Week 1 MVP reduction. Use an imported log file instead.";
    case "http-poll":
      return "Disabled in the Week 1 MVP reduction. Use an imported log file instead.";
    case "journald":
      return "Disabled in the Week 1 MVP reduction. Use an imported log file instead.";
    case "file":
    default:
      return "Tail the imported log file directly from disk through Maia's single supported live-analysis pipeline.";
  }
}
