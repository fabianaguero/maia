import type { AppTranslations } from "../../i18n/types";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { MonitorContextValue } from "../monitor/monitorContextTypes";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";
import type { SessionScreenControllerInput, SessionScreenControllerState } from "./sessionScreenControllerTypes";
import type { SessionControllerDerivedState } from "./sessionScreenRuntime";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

type MonitorSnapshot = ReturnType<typeof buildSessionScreenControllerMonitorSnapshot>;
type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;

export function buildSessionScreenControllerMonitorSnapshotInput(
  monitor: Pick<
    MonitorContextValue,
    | "session"
    | "metrics"
    | "subscribe"
    | "isPlaybackPaused"
    | "playbackEventIndex"
    | "playbackEventCount"
  >,
) {
  return {
    session: monitor.session,
    metrics: monitor.metrics,
    subscribe: monitor.subscribe,
    isPlaybackPaused: monitor.isPlaybackPaused,
    playbackEventIndex: monitor.playbackEventIndex,
    playbackEventCount: monitor.playbackEventCount,
  };
}

export function buildSessionScreenControllerSlicesInput(input: {
  t: AppTranslations;
  controllerInput: SessionScreenControllerInput;
  monitorSnapshot: MonitorSnapshot;
  localState: SessionScreenLocalState;
}) {
  return {
    t: input.t,
    input: input.controllerInput,
    monitorSnapshot: input.monitorSnapshot,
    localState: input.localState,
  };
}

export function buildSessionScreenControllerStateInput(input: {
  t: AppTranslations;
  monitor: MonitorContextValue;
  localState: SessionScreenLocalState;
  derivedState: SessionControllerDerivedState;
  actions: Pick<
    SessionScreenControllerState,
    | "handleCreateSession"
    | "handleDirectLaunch"
    | "handleResumeSession"
    | "handlePlaybackSession"
    | "handleReplayBookmark"
  >;
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  booth: SessionBoothViewModel;
}): SessionScreenControllerState {
  return {
    t: input.t,
    monitor: input.monitor,
    mode: input.localState.mode,
    setMode: input.localState.setMode,
    baseMode: input.localState.baseMode,
    setBaseMode: input.localState.setBaseMode,
    selectedSourceId: input.localState.selectedSourceId,
    setSelectedSourceId: input.localState.setSelectedSourceId,
    selectedTrackId: input.localState.selectedTrackId,
    setSelectedTrackId: input.localState.setSelectedTrackId,
    selectedPlaylistId: input.localState.selectedPlaylistId,
    setSelectedPlaylistId: input.localState.setSelectedPlaylistId,
    sessionLabel: input.localState.sessionLabel,
    setSessionLabel: input.localState.setSessionLabel,
    creating: input.localState.creating,
    createError: input.localState.createError,
    latestUpdate: input.localState.latestUpdate,
    directPath: input.localState.directPath,
    setDirectPath: input.localState.setDirectPath,
    isDirectLoading: input.localState.isDirectLoading,
    selectedTemplateId: input.localState.selectedTemplateId,
    setSelectedTemplateId: input.localState.setSelectedTemplateId,
    sourceOptions: input.derivedState.sourceOptions,
    selectedSource: input.derivedState.selectedSource,
    selectedTrack: input.derivedState.selectedTrack,
    selectedPlaylist: input.derivedState.selectedPlaylist,
    selectedBaseDetails: input.derivedState.selectedBaseDetails,
    handleCreateSession: input.actions.handleCreateSession,
    handleDirectLaunch: input.actions.handleDirectLaunch,
    handleResumeSession: input.actions.handleResumeSession,
    handlePlaybackSession: input.actions.handlePlaybackSession,
    handleReplayBookmark: input.actions.handleReplayBookmark,
    activeSession: input.derivedState.activeSession,
    selectedSession: input.derivedState.selectedSession,
    playbackActive: input.derivedState.playbackActive,
    liveMonitorActive: input.derivedState.liveMonitorActive,
    selectedSessionBookmarks: input.derivedState.selectedSessionBookmarks,
    bookmarkContexts: input.derivedState.bookmarkContexts,
    selectedSessionReplayFeedbackRecommendation:
      input.selectedSessionReplayFeedbackRecommendation,
    sessionLabelPlaceholder: input.derivedState.sessionLabelPlaceholder,
    readyToRun: input.derivedState.readyToRun,
    booth: input.booth,
  };
}
