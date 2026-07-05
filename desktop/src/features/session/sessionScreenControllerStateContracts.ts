import type { AppTranslations } from "../../i18n/types";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { MonitorContextValue } from "../monitor/monitorContextTypes";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { SessionScreenControllerState } from "./sessionScreenControllerTypes";
import type { SessionControllerDerivedState } from "./sessionScreenRuntime";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

export type SessionScreenControllerMonitorSnapshot = ReturnType<
  typeof buildSessionScreenControllerMonitorSnapshot
>;
export type SessionScreenControllerLocalState = ReturnType<typeof useSessionScreenLocalState>;

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

export interface SessionScreenControllerDerivedBindingsInput {
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  booth: SessionBoothViewModel;
}

export interface SessionScreenControllerStateSectionsInput {
  localState: SessionScreenControllerLocalState;
  actions: SessionScreenControllerActionBindings;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  booth: SessionBoothViewModel;
}

export type SessionScreenControllerMonitorSnapshotInput = Pick<
  MonitorContextValue,
  | "session"
  | "metrics"
  | "subscribe"
  | "isPlaybackPaused"
  | "playbackEventIndex"
  | "playbackEventCount"
>;

export interface SessionScreenControllerSlicesHookInput {
  t: AppTranslations;
  controllerInput: SessionScreenControllerInput;
  monitorSnapshot: SessionScreenControllerMonitorSnapshot;
  localState: SessionScreenControllerLocalState;
}

export interface SessionScreenControllerStateInput {
  t: AppTranslations;
  monitor: MonitorContextValue;
  localState: SessionScreenControllerLocalState;
  actions: SessionScreenControllerActionBindings;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  booth: SessionBoothViewModel;
}

export interface SessionScreenControllerStateFromSlicesInput {
  t: AppTranslations;
  monitor: MonitorContextValue;
  localState: SessionScreenControllerLocalState;
  slicesResult: SessionScreenControllerSlicesResult;
}
