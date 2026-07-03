import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { AppTranslations } from "../../i18n/types";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import type { BuildSessionBoothViewModelInput } from "./sessionBoothViewModelTypes";
import type { PersistedSession } from "../../api/sessions";
import type { QuickSessionMode } from "./sessionDisplay";
import type { SessionScreenControllerState } from "./sessionScreenControllerTypes";
import type { SessionControllerDerivedState } from "./sessionScreenRuntime";

export function buildSessionScreenEffectsHookInput(input: {
  monitorSessionId: string | null;
  subscribeToMonitor: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  setLatestUpdate: (update: LiveLogStreamUpdate | null) => void;
  selectedSessionIdForEvents: string | null;
  setSelectedSessionEvents: (events: SessionEvent[]) => void;
  activeBedUrl: string | null;
  boothBedAudioRef: MutableRefObject<HTMLAudioElement | null>;
}) {
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
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  isPlaybackPaused: boolean;
  playbackEventIndex: number | null;
  playbackEventCount: number | null;
}): BuildSessionBoothViewModelInput {
  return input;
}

export function buildSessionScreenControllerBoothHookInput(input: {
  t: AppTranslations;
  mode: QuickSessionMode;
  latestUpdate: LiveLogStreamUpdate | null;
  derivedState: Pick<
    SessionControllerDerivedState,
    | "playbackActive"
    | "liveMonitorActive"
    | "readyToRun"
    | "playbackPercent"
    | "activeSession"
    | "selectedSource"
    | "selectedBaseDetails"
    | "selectedSessionBaseDetails"
    | "activeBaseDetails"
    | "activeSourceDetails"
    | "selectedSessionSourceDetails"
  >;
  monitorSnapshot: {
    monitorSession: ActiveMonitorSession | null;
    monitorMetrics: MonitorMetrics;
    isPlaybackPaused: boolean;
    playbackEventIndex: number | null;
    playbackEventCount: number | null;
  };
}) {
  return {
    t: input.t,
    mode: input.mode,
    latestUpdate: input.latestUpdate,
    playbackActive: input.derivedState.playbackActive,
    liveMonitorActive: input.derivedState.liveMonitorActive,
    readyToRun: input.derivedState.readyToRun,
    playbackPercent: input.derivedState.playbackPercent,
    activeSession: input.derivedState.activeSession,
    selectedSourceTitle: input.derivedState.selectedSource?.title ?? null,
    selectedSourcePath: input.derivedState.selectedSource?.sourcePath ?? null,
    selectedSourceSuggestedBpm: input.derivedState.selectedSource?.suggestedBpm ?? null,
    selectedSessionSourceLabel: input.derivedState.selectedSessionSourceDetails.label,
    selectedSessionSourcePath: input.derivedState.selectedSessionSourceDetails.path,
    selectedBaseLabel: input.derivedState.selectedBaseDetails.label,
    selectedBaseDetail: input.derivedState.selectedBaseDetails.detail,
    selectedSessionBaseLabel: input.derivedState.selectedSessionBaseDetails.label,
    selectedSessionBaseDetail: input.derivedState.selectedSessionBaseDetails.detail,
    activeBaseLabel: input.derivedState.activeBaseDetails.label,
    activeBaseDetail: input.derivedState.activeBaseDetails.detail,
    activeSourceLabel: input.derivedState.activeSourceDetails.label,
    activeSourcePath: input.derivedState.activeSourceDetails.path,
    monitorSession: input.monitorSnapshot.monitorSession,
    monitorMetrics: input.monitorSnapshot.monitorMetrics,
    isPlaybackPaused: input.monitorSnapshot.isPlaybackPaused,
    playbackEventIndex: input.monitorSnapshot.playbackEventIndex,
    playbackEventCount: input.monitorSnapshot.playbackEventCount,
  };
}

export function buildSessionScreenControllerHookResult<T extends SessionScreenControllerState>(
  input: T,
): T {
  return input;
}
