import type { BuildSessionBoothViewModelInput } from "./sessionBoothViewModelTypes";
import { getStreamAdapterLabel } from "../../utils/streamAdapter";
import { resolveModeLabel } from "./sessionDisplay";

export function resolveSessionBoothSourceState(input: BuildSessionBoothViewModelInput) {
  const sourceLabel = input.liveMonitorActive
    ? (input.activeSourceLabel ?? input.monitorSession?.repoTitle ?? null)
    : (input.selectedSourceTitle ?? input.selectedSessionSourceLabel);
  const sourcePath = input.liveMonitorActive
    ? (input.activeSourcePath ?? input.monitorSession?.sourcePath ?? null)
    : (input.selectedSourcePath ?? input.selectedSessionSourcePath);
  const baseLabel = input.liveMonitorActive
    ? (input.activeBaseLabel ?? null)
    : (input.selectedBaseLabel ?? input.selectedSessionBaseLabel);
  const baseDetail = input.liveMonitorActive
    ? input.activeBaseDetail
    : (input.selectedBaseDetail ?? input.selectedSessionBaseDetail);
  const adapterLabel = input.monitorSession
    ? getStreamAdapterLabel(input.monitorSession.adapterKind)
    : resolveModeLabel(input.mode, input.t.session.logFile, input.t.session.repository);
  const signalBpm =
    input.latestUpdate?.suggestedBpm ??
    (input.liveMonitorActive
      ? (input.activeSession?.lastBpm ?? null)
      : (input.selectedSourceSuggestedBpm ?? null));

  return {
    sourceLabel,
    sourcePath,
    baseLabel,
    baseDetail,
    adapterLabel,
    signalBpm,
  };
}
