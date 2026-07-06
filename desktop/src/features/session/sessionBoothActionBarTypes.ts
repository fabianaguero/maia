import type { PersistedSession } from "../../api/sessions";

export interface SessionBoothActionBarLabels {
  prevWindow: string;
  nextWindow: string;
  resumeReplay: string;
  pauseReplay: string;
  exitReplay: string;
  stopSession: string;
  pastePath: string;
  launching: string;
  launch: string;
  resumeSelected: string;
  replaySelected: string;
  startSession: string;
}

export interface SessionBoothActionBarProps {
  playbackActive: boolean;
  liveMonitorActive: boolean;
  mutating: boolean;
  readyToRun: boolean;
  isPlaybackPaused: boolean;
  directPath: string;
  isDirectLoading: boolean;
  selectedSession: PersistedSession | null;
  creating: boolean;
  labels: SessionBoothActionBarLabels;
  onDirectPathChange: (value: string) => void;
  onDirectLaunch: () => void | Promise<void>;
  onResumeSelected: () => void;
  onReplaySelected: () => void | Promise<void>;
  onCreateSession: () => void | Promise<void>;
  onStepPlaybackWindow: (direction: 1 | -1) => void;
  onToggleReplayPlayback: () => void;
  onStopSession: () => void | Promise<void>;
}

export interface SessionBoothActionBarPlaybackProps {
  mutating: boolean;
  isPlaybackPaused: boolean;
  labels: SessionBoothActionBarLabels;
  onStepPlaybackWindow: (direction: 1 | -1) => void;
  onToggleReplayPlayback: () => void;
  onStopSession: () => void | Promise<void>;
}

export interface SessionBoothActionBarLiveProps {
  mutating: boolean;
  labels: SessionBoothActionBarLabels;
  onStopSession: () => void | Promise<void>;
}

export interface SessionBoothActionBarIdleProps {
  mutating: boolean;
  directPath: string;
  isDirectLoading: boolean;
  showResumeSelected: boolean;
  showReplaySelected: boolean;
  directLaunchDisabled: boolean;
  startDisabled: boolean;
  labels: SessionBoothActionBarLabels;
  onDirectPathChange: (value: string) => void;
  onDirectLaunch: () => void | Promise<void>;
  onResumeSelected: () => void;
  onReplaySelected: () => void | Promise<void>;
  onCreateSession: () => void | Promise<void>;
}
