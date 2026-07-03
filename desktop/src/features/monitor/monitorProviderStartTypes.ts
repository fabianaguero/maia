import type { MutableRefObject } from "react";

import type { SourceTemplate } from "../../config/sourceTemplates";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type SetSourceTemplateState = (value: SourceTemplate) => void;
type ResetReplayTelemetryFn = () => void;

export interface MonitorProviderStartLogger {
  info: (message: string, ...args: unknown[]) => void;
}

export interface MonitorProviderLiveStartSharedInput {
  session: ActiveMonitorSession;
  sourceTemplateId?: string | null;
  persistedSessionId?: string | null;
  startFromBeginning?: boolean;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollIndexRef: MutableRefObject<number>;
  activeTemplateRef: MutableRefObject<SourceTemplate>;
  setActiveTemplateState: SetSourceTemplateState;
  updatePersistedSessionStatus: (
    id: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void> | void;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setMetrics: SetMetricsState;
  resetReplayTelemetry: ResetReplayTelemetryFn;
  ensureAudioContext: () => Promise<AudioContext>;
  emitProbe?: ((context: AudioContext) => void) | null;
  reloadPendingGuideTrack: () => void;
  doPoll: () => void;
  logger?: MonitorProviderStartLogger;
  logLabel?: string;
}

export type MonitorProviderLiveStartBaseInput = Omit<
  MonitorProviderLiveStartSharedInput,
  "session" | "sourceTemplateId" | "persistedSessionId" | "startFromBeginning" | "logLabel"
>;
