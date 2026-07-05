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
