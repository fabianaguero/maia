import type { InsertSessionEventInput } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorMetrics, StreamListener } from "./monitorContextTypes";

export interface MonitorListenerRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
  trace?: (message: string, ...args: unknown[]) => void;
}

export type SetMetricsState = (
  updater: MonitorMetrics | ((previous: MonitorMetrics) => MonitorMetrics),
) => void;

export interface PersistedMonitorCursorUpdate {
  sessionId: string;
  toOffset: number;
  lineCount: number;
  anomalyCount: number;
  suggestedBpm: number | null;
}

export interface MonitorStreamUpdatePersistenceInput {
  persistedSessionId?: string | null;
  pollIndex: number;
  update: LiveLogStreamUpdate;
  updatePersistedCursor: (payload: PersistedMonitorCursorUpdate) => void;
  insertPersistedEvent: (payload: InsertSessionEventInput) => void;
}

export interface ApplyMonitorStreamUpdateStateInput {
  update: LiveLogStreamUpdate;
  listeners: Iterable<StreamListener>;
  persistedSessionId?: string | null;
  pollIndex: number;
  accumulateMetrics?: boolean;
  persistPlaybackEvent?: boolean;
  setMetrics: SetMetricsState;
  resumeSuspendedAudioContext: () => void;
  updatePersistedCursor: (payload: PersistedMonitorCursorUpdate) => void;
  insertPersistedEvent: (payload: InsertSessionEventInput) => void;
  logger?: MonitorListenerRuntimeLogger;
}
