import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";
import type { SessionScreenControllerState } from "./sessionScreenControllerTypes";
import type { SessionControllerDerivedState } from "./sessionScreenRuntime";

export type SessionScreenControllerActionBindings = Pick<
  SessionScreenControllerState,
  | "handleCreateSession"
  | "handleDirectLaunch"
  | "handleResumeSession"
  | "handlePlaybackSession"
  | "handleReplayBookmark"
>;

export interface SessionScreenControllerSlicesResult {
  actions: SessionScreenControllerActionBindings;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  booth: SessionBoothViewModel;
}

export type SessionScreenControllerDerivedBindings = Pick<
  SessionScreenControllerState,
  | "sourceOptions"
  | "selectedSource"
  | "selectedTrack"
  | "selectedPlaylist"
  | "selectedBaseDetails"
  | "activeSession"
  | "selectedSession"
  | "playbackActive"
  | "liveMonitorActive"
  | "selectedSessionBookmarks"
  | "bookmarkContexts"
  | "selectedSessionReplayFeedbackRecommendation"
  | "sessionLabelPlaceholder"
  | "readyToRun"
  | "booth"
>;

export type SessionScreenControllerLocalBindings = Pick<
  SessionScreenControllerState,
  | "mode"
  | "setMode"
  | "baseMode"
  | "setBaseMode"
  | "selectedSourceId"
  | "setSelectedSourceId"
  | "selectedTrackId"
  | "setSelectedTrackId"
  | "selectedPlaylistId"
  | "setSelectedPlaylistId"
  | "sessionLabel"
  | "setSessionLabel"
  | "creating"
  | "createError"
  | "latestUpdate"
  | "directPath"
  | "setDirectPath"
  | "isDirectLoading"
  | "selectedTemplateId"
  | "setSelectedTemplateId"
>;

export interface SessionScreenControllerStateSections {
  localBindings: SessionScreenControllerLocalBindings;
  actionBindings: SessionScreenControllerActionBindings;
  derivedBindings: SessionScreenControllerDerivedBindings;
}
