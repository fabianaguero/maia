import type { BuildSessionBoothViewModelInput } from "./sessionBoothViewModelTypes";

export function resolveSessionBoothState(input: {
  playbackActive: boolean;
  isPlaybackPaused: boolean;
  liveMonitorActive: boolean;
  readyToRun: boolean;
  latestUpdate: BuildSessionBoothViewModelInput["latestUpdate"];
  t: BuildSessionBoothViewModelInput["t"];
}) {
  return input.playbackActive
    ? input.isPlaybackPaused
      ? { tone: "replay" as const, label: input.t.session.replayPaused }
      : { tone: "replay" as const, label: input.t.session.replayActive }
    : input.liveMonitorActive
      ? input.latestUpdate?.hasData
        ? { tone: "live" as const, label: input.t.session.liveHot }
        : { tone: "armed" as const, label: input.t.session.listening }
      : input.readyToRun
        ? { tone: "armed" as const, label: input.t.session.boothArmed }
        : { tone: "idle" as const, label: input.t.session.boothIdle };
}

export function resolveSessionBoothHeadline(input: {
  playbackActive: boolean;
  liveMonitorActive: boolean;
  activeSession: BuildSessionBoothViewModelInput["activeSession"];
  monitorSession: BuildSessionBoothViewModelInput["monitorSession"];
  sourceLabel: string | null;
  t: BuildSessionBoothViewModelInput["t"];
}): string {
  return input.playbackActive
    ? input.activeSession?.label || input.t.session.replayDeck
    : input.liveMonitorActive
      ? input.activeSession?.label || input.monitorSession?.repoTitle || input.t.session.liveMonitor
      : input.sourceLabel || input.t.session.armMonitor;
}

export function resolveSessionBoothSummary(input: {
  playbackActive: boolean;
  liveMonitorActive: boolean;
  readyToRun: boolean;
  latestUpdate: BuildSessionBoothViewModelInput["latestUpdate"];
  playbackPercent: number | null;
  t: BuildSessionBoothViewModelInput["t"];
}): string {
  return input.playbackActive
    ? input.latestUpdate?.summary ||
        input.t.session.replayDeckSummary.replace("{progress}", String(input.playbackPercent ?? 0))
    : input.liveMonitorActive
      ? input.latestUpdate?.hasData
        ? input.latestUpdate.summary
        : input.t.session.waitingLiveWindow
      : input.readyToRun
        ? input.t.session.baseAndSourceArmed
        : input.t.session.chooseBaseAndSource;
}
