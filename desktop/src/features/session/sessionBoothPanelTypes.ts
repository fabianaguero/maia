import type { PersistedSession } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { QuickSessionMode } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";

export interface SessionBoothPanelProps {
  booth: SessionBoothViewModel;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  mutating: boolean;
  readyToRun: boolean;
  mode: QuickSessionMode;
  latestUpdate: LiveLogStreamUpdate | null;
  monitorSessionId: string | null;
  isPlaybackPaused: boolean;
  directPath: string;
  isDirectLoading: boolean;
  selectedSession: PersistedSession | null;
  creating: boolean;
  onDirectPathChange: (value: string) => void;
  onDirectLaunch: () => void | Promise<void>;
  onResumeSelected: () => void;
  onReplaySelected: () => void | Promise<void>;
  onCreateSession: () => void | Promise<void>;
  onStepPlaybackWindow: (direction: 1 | -1) => void;
  onToggleReplayPlayback: () => void;
  onStopSession: () => void | Promise<void>;
}
