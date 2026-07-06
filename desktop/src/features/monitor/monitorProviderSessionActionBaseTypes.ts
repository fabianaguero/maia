import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate, StartSessionInput } from "../../types/monitor";
import type { MonitorProviderLiveStartBaseInput } from "./monitorProviderStartRuntime";

export type BuildLiveStartInputFn = (
  reason: "session-start" | "attach-session",
  includeProbe: boolean,
) => MonitorProviderLiveStartBaseInput;
export type StartStreamSessionFn = (input: StartSessionInput) => Promise<unknown>;
export type StopStreamSessionFn = (sessionId: string) => Promise<unknown>;
export type ListSessionEventsFn = (sessionId: string) => Promise<SessionEvent[]>;
export type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;

export interface MonitorProviderSessionActionsLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  trace: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}
