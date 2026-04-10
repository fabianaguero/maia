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
      return "Read stdout and stderr from a local command and turn it into a live monitoring mix.";
    case "websocket":
      return "Ingest newline-delimited frames from a WebSocket feed and route them through Maia's live scene.";
    case "http-poll":
      return "Poll a URL on Maia's live interval and sonify the response body as operational signal.";
    case "journald":
      return "Follow systemd journals locally, optionally filtered to a unit, and keep the session musical.";
    case "file":
    default:
      return "Tail the imported log file directly from disk and bend the listening bed with each new window.";
  }
}
