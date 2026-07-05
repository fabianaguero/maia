import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { AppTranslations } from "../../i18n/types";
import type { BuildSessionBoothViewModelInput } from "./sessionBoothViewModelTypes";
import type { PersistedSession } from "../../api/sessions";
import type { QuickSessionMode } from "./sessionDisplay";
import type {
  SessionScreenControllerBoothBaseBindings,
  SessionScreenControllerBoothDerivedState,
  SessionScreenControllerBoothMonitorSnapshot,
  SessionScreenControllerBoothSessionBindings,
  SessionScreenControllerBoothSourceBindings,
  SessionScreenEffectsHookBindings,
} from "./sessionScreenControllerBoothContracts";
import type { SessionScreenControllerState } from "./sessionScreenControllerTypes";

export function buildSessionScreenEffectsHookInput(input: {
  monitorSessionId: SessionScreenEffectsHookBindings["monitorSessionId"];
  subscribeToMonitor: SessionScreenEffectsHookBindings["subscribeToMonitor"];
  setLatestUpdate: SessionScreenEffectsHookBindings["setLatestUpdate"];
  selectedSessionIdForEvents: SessionScreenEffectsHookBindings["selectedSessionIdForEvents"];
  setSelectedSessionEvents: SessionScreenEffectsHookBindings["setSelectedSessionEvents"];
  activeBedUrl: SessionScreenEffectsHookBindings["activeBedUrl"];
  boothBedAudioRef: SessionScreenEffectsHookBindings["boothBedAudioRef"];
}): SessionScreenEffectsHookBindings {
  return {
    monitorSessionId: input.monitorSessionId,
    subscribeToMonitor: input.subscribeToMonitor,
    setLatestUpdate: input.setLatestUpdate,
    selectedSessionIdForEvents: input.selectedSessionIdForEvents,
    setSelectedSessionEvents: input.setSelectedSessionEvents,
    activeBedUrl: input.activeBedUrl,
    boothBedAudioRef: input.boothBedAudioRef,
  };
}

export function buildSessionScreenBoothViewModelInput(input: {
  t: AppTranslations;
  mode: QuickSessionMode;
  latestUpdate: LiveLogStreamUpdate | null;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  readyToRun: boolean;
  playbackPercent: number | null;
  activeSession: PersistedSession | null;
  selectedSourceTitle: string | null;
  selectedSourcePath: string | null;
  selectedSourceSuggestedBpm: number | null;
  selectedSessionSourceLabel: string | null;
  selectedSessionSourcePath: string | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  selectedSessionBaseLabel: string | null;
  selectedSessionBaseDetail: string | null;
  activeBaseLabel: string | null;
  activeBaseDetail: string | null;
  activeSourceLabel: string | null;
  activeSourcePath: string | null;
  monitorSession: SessionScreenControllerBoothMonitorSnapshot["monitorSession"];
  monitorMetrics: SessionScreenControllerBoothMonitorSnapshot["monitorMetrics"];
  isPlaybackPaused: SessionScreenControllerBoothMonitorSnapshot["isPlaybackPaused"];
  playbackEventIndex: SessionScreenControllerBoothMonitorSnapshot["playbackEventIndex"];
  playbackEventCount: SessionScreenControllerBoothMonitorSnapshot["playbackEventCount"];
}): BuildSessionBoothViewModelInput {
  return input;
}

export function buildSessionScreenControllerBoothDerivedBindings(
  derivedState: SessionScreenControllerBoothDerivedState,
) {
  return {
    ...buildSessionScreenControllerBoothSessionBindings(derivedState),
    ...buildSessionScreenControllerBoothSourceBindings(derivedState),
    ...buildSessionScreenControllerBoothBaseBindings(derivedState),
  };
}

export function buildSessionScreenControllerBoothSessionBindings(
  derivedState: SessionScreenControllerBoothDerivedState,
): SessionScreenControllerBoothSessionBindings {
  return {
    playbackActive: derivedState.playbackActive,
    liveMonitorActive: derivedState.liveMonitorActive,
    readyToRun: derivedState.readyToRun,
    playbackPercent: derivedState.playbackPercent,
    activeSession: derivedState.activeSession,
  };
}

export function buildSessionScreenControllerBoothSourceBindings(
  derivedState: SessionScreenControllerBoothDerivedState,
): SessionScreenControllerBoothSourceBindings {
  return {
    selectedSourceTitle: derivedState.selectedSource?.title ?? null,
    selectedSourcePath: derivedState.selectedSource?.sourcePath ?? null,
    selectedSourceSuggestedBpm: derivedState.selectedSource?.suggestedBpm ?? null,
    selectedSessionSourceLabel: derivedState.selectedSessionSourceDetails.label,
    selectedSessionSourcePath: derivedState.selectedSessionSourceDetails.path,
    activeSourceLabel: derivedState.activeSourceDetails.label,
    activeSourcePath: derivedState.activeSourceDetails.path,
  };
}

export function buildSessionScreenControllerBoothBaseBindings(
  derivedState: SessionScreenControllerBoothDerivedState,
): SessionScreenControllerBoothBaseBindings {
  return {
    selectedBaseLabel: derivedState.selectedBaseDetails.label,
    selectedBaseDetail: derivedState.selectedBaseDetails.detail,
    selectedSessionBaseLabel: derivedState.selectedSessionBaseDetails.label,
    selectedSessionBaseDetail: derivedState.selectedSessionBaseDetails.detail,
    activeBaseLabel: derivedState.activeBaseDetails.label,
    activeBaseDetail: derivedState.activeBaseDetails.detail,
  };
}

export function buildSessionScreenControllerBoothMonitorBindings(input: {
  monitorSession: SessionScreenControllerBoothMonitorSnapshot["monitorSession"];
  monitorMetrics: SessionScreenControllerBoothMonitorSnapshot["monitorMetrics"];
  isPlaybackPaused: SessionScreenControllerBoothMonitorSnapshot["isPlaybackPaused"];
  playbackEventIndex: SessionScreenControllerBoothMonitorSnapshot["playbackEventIndex"];
  playbackEventCount: SessionScreenControllerBoothMonitorSnapshot["playbackEventCount"];
}): SessionScreenControllerBoothMonitorSnapshot {
  return {
    monitorSession: input.monitorSession,
    monitorMetrics: input.monitorMetrics,
    isPlaybackPaused: input.isPlaybackPaused,
    playbackEventIndex: input.playbackEventIndex,
    playbackEventCount: input.playbackEventCount,
  };
}

export function buildSessionScreenControllerBoothHookInput(input: {
  t: AppTranslations;
  mode: QuickSessionMode;
  latestUpdate: LiveLogStreamUpdate | null;
  derivedState: SessionScreenControllerBoothDerivedState;
  monitorSnapshot: SessionScreenControllerBoothMonitorSnapshot;
}) {
  const derivedBindings = buildSessionScreenControllerBoothDerivedBindings(input.derivedState);
  const monitorBindings = buildSessionScreenControllerBoothMonitorBindings(input.monitorSnapshot);

  return {
    t: input.t,
    mode: input.mode,
    latestUpdate: input.latestUpdate,
    ...derivedBindings,
    ...monitorBindings,
  };
}

export function buildSessionScreenControllerHookResult<T extends SessionScreenControllerState>(
  input: T,
): T {
  return input;
}
