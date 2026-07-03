import type { ActiveMonitorSession } from "../../monitor/monitorContextTypes";
import { getStreamAdapterLabel } from "../../../utils/streamAdapter";
import type { LiveMonitorDisplayLabels, SessionCardDisplay } from "./liveLogMonitorDisplayRuntime";

export function resolveSessionCardDisplay(input: {
  session: ActiveMonitorSession;
  replayActive: boolean;
  playbackPercent: number | null;
  windowsHeard: number;
  labels: Pick<
    LiveMonitorDisplayLabels,
    | "replaySessionTitle"
    | "sessionTitle"
    | "storedSourceReplay"
    | "fallbackDirectFilePoll"
    | "replayComplete"
    | "windowsReplayed"
  >;
}): SessionCardDisplay {
  const sourceSummary = input.replayActive
    ? `${input.labels.storedSourceReplay} · ${input.session.sourcePath}`
    : input.session.pollMode === "direct"
      ? input.labels.fallbackDirectFilePoll
      : input.session.pollMode === "websocket"
        ? `${getStreamAdapterLabel("websocket")} · ${input.session.sourcePath}`
        : input.session.pollMode === "http-poll"
          ? `${getStreamAdapterLabel("http-poll")} · ${input.session.sourcePath}`
          : `${getStreamAdapterLabel(input.session.adapterKind)} · ${input.session.sourcePath}`;

  return {
    title: input.replayActive ? input.labels.replaySessionTitle : input.labels.sessionTitle,
    sourceSummary,
    replayProgressSummary:
      input.replayActive && input.playbackPercent !== null
        ? `${input.playbackPercent}% ${input.labels.replayComplete} · ${input.labels.windowsReplayed.replace("{count}", String(input.windowsHeard))}`
        : null,
  };
}
