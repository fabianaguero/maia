import type { ComponentProps } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { PersistedSession } from "../../api/sessions";
import type { QuickSessionMode } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";
import type { SessionBoothDetailGrid } from "./SessionBoothDetailGrid";
import type { SessionBoothHeader } from "./SessionBoothHeader";
import type { SessionBoothProgress } from "./SessionBoothProgress";
import type { SessionBoothRouteGrid } from "./SessionBoothRouteGrid";

export interface SessionBoothHeaderLabels {
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

export interface SessionBoothRouteLabels {
  sourceFeed: string;
  baseBed: string;
  adapter: string;
  notSelected: string;
  pickSourceHint: string;
  notArmed: string;
  baseBedHint: string;
  sessionRef: string;
  readyToLaunchMode: string;
  logFile: string;
  repository: string;
}

export interface SessionBoothDetailLabels {
  signalSnapshot: string;
  latestWindowLines: string;
  waitingStreamData: string;
  awaitingInput: string;
  noLevelBreakdown: string;
  topComponentsSoon: string;
  replayNotes: string;
  watchouts: string;
  latestWindowAnomalies: string;
  noCurrentBurst: string;
  runBoothHint: string;
  sourceActiveHint: string;
}

export interface SessionBoothHeaderInput {
  t: AppTranslations;
  booth: SessionBoothViewModel;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  mutating: boolean;
  readyToRun: boolean;
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

export interface SessionBoothProgressInput {
  booth: SessionBoothViewModel;
  playbackActive: boolean;
  liveMonitorActive: boolean;
}

export interface SessionBoothRouteInput {
  t: AppTranslations;
  booth: SessionBoothViewModel;
  monitorSessionId: string | null;
  mode: QuickSessionMode;
}

export interface SessionBoothDetailInput {
  t: AppTranslations;
  booth: SessionBoothViewModel;
  latestUpdate: LiveLogStreamUpdate | null;
  playbackActive: boolean;
  readyToRun: boolean;
}

export interface SessionBoothPanelLabelGroups {
  header: SessionBoothHeaderLabels;
  route: SessionBoothRouteLabels;
  detail: SessionBoothDetailLabels;
}

export interface SessionBoothPanelDerivedState {
  labels: SessionBoothPanelLabelGroups;
  progressVisible: boolean;
}

export interface SessionBoothPanelSections {
  headerProps: ComponentProps<typeof SessionBoothHeader>;
  progressProps: ComponentProps<typeof SessionBoothProgress>;
  routeProps: ComponentProps<typeof SessionBoothRouteGrid>;
  detailProps: ComponentProps<typeof SessionBoothDetailGrid>;
  stats: SessionBoothViewModel["stats"];
}
