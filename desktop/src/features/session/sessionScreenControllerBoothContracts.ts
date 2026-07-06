import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import type { SessionControllerDerivedState } from "./sessionScreenRuntime";

export type SessionScreenControllerBoothDerivedState = Pick<
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

export interface SessionScreenControllerBoothSourceBindings {
  selectedSourceTitle: string | null;
  selectedSourcePath: string | null;
  selectedSourceSuggestedBpm: number | null;
  selectedSessionSourceLabel: string | null;
  selectedSessionSourcePath: string | null;
  activeSourceLabel: string | null;
  activeSourcePath: string | null;
}

export interface SessionScreenControllerBoothBaseBindings {
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  selectedSessionBaseLabel: string | null;
  selectedSessionBaseDetail: string | null;
  activeBaseLabel: string | null;
  activeBaseDetail: string | null;
}

export interface SessionScreenControllerBoothSessionBindings {
  playbackActive: boolean;
  liveMonitorActive: boolean;
  readyToRun: boolean;
  playbackPercent: number | null;
  activeSession: SessionControllerDerivedState["activeSession"];
}

export interface SessionScreenControllerBoothMonitorSnapshot {
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  isPlaybackPaused: boolean;
  playbackEventIndex: number | null;
  playbackEventCount: number | null;
}

export interface SessionScreenEffectsHookBindings {
  monitorSessionId: string | null;
  subscribeToMonitor: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  setLatestUpdate: (update: LiveLogStreamUpdate | null) => void;
  selectedSessionIdForEvents: string | null;
  setSelectedSessionEvents: (events: SessionEvent[]) => void;
  activeBedUrl: string | null;
  boothBedAudioRef: MutableRefObject<HTMLAudioElement | null>;
}
