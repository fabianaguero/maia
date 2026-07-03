import type { SessionEvent } from "../../api/sessions";
import type { ActiveMonitorSession } from "./monitorContextTypes";

export interface MonitorPlaybackRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
}

export interface PlaybackSessionSelection {
  sessionId: string;
  label: string;
  sourcePath: string;
  repoId?: string | null;
}

export interface PreparedPlaybackMonitorSession {
  session: ActiveMonitorSession;
  events: SessionEvent[];
  shouldHydrateReplay: boolean;
}
