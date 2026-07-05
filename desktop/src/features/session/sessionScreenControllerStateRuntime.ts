import type { AppTranslations } from "../../i18n/types";
import type { MonitorContextValue } from "../monitor/monitorContextTypes";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";
import type {
  SessionScreenControllerInput,
  SessionScreenControllerState,
} from "./sessionScreenControllerTypes";
import type { SessionControllerDerivedState } from "./sessionScreenRuntime";
import type {
  SessionScreenControllerActionBindings,
  SessionScreenControllerDerivedBindings,
  SessionScreenControllerLocalBindings,
  SessionScreenControllerSlicesResult,
  SessionScreenControllerStateSections,
} from "./sessionScreenControllerStateContracts";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

type MonitorSnapshot = ReturnType<typeof buildSessionScreenControllerMonitorSnapshot>;
type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;

export function buildSessionScreenControllerLocalBindings(
  localState: SessionScreenLocalState,
): SessionScreenControllerLocalBindings {
  return {
    mode: localState.mode,
    setMode: localState.setMode,
    baseMode: localState.baseMode,
    setBaseMode: localState.setBaseMode,
    selectedSourceId: localState.selectedSourceId,
    setSelectedSourceId: localState.setSelectedSourceId,
    selectedTrackId: localState.selectedTrackId,
    setSelectedTrackId: localState.setSelectedTrackId,
    selectedPlaylistId: localState.selectedPlaylistId,
    setSelectedPlaylistId: localState.setSelectedPlaylistId,
    sessionLabel: localState.sessionLabel,
    setSessionLabel: localState.setSessionLabel,
    creating: localState.creating,
    createError: localState.createError,
    latestUpdate: localState.latestUpdate,
    directPath: localState.directPath,
    setDirectPath: localState.setDirectPath,
    isDirectLoading: localState.isDirectLoading,
    selectedTemplateId: localState.selectedTemplateId,
    setSelectedTemplateId: localState.setSelectedTemplateId,
  };
}

export function buildSessionScreenControllerActionBindings(
  actions: SessionScreenControllerActionBindings,
): SessionScreenControllerActionBindings {
  return {
    handleCreateSession: actions.handleCreateSession,
    handleDirectLaunch: actions.handleDirectLaunch,
    handleResumeSession: actions.handleResumeSession,
    handlePlaybackSession: actions.handlePlaybackSession,
    handleReplayBookmark: actions.handleReplayBookmark,
  };
}

export function buildSessionScreenControllerDerivedBindings(input: {
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: SessionScreenControllerSlicesResult["selectedSessionReplayFeedbackRecommendation"];
  booth: SessionScreenControllerSlicesResult["booth"];
}): SessionScreenControllerDerivedBindings {
  return {
    sourceOptions: input.derivedState.sourceOptions,
    selectedSource: input.derivedState.selectedSource,
    selectedTrack: input.derivedState.selectedTrack,
    selectedPlaylist: input.derivedState.selectedPlaylist,
    selectedBaseDetails: input.derivedState.selectedBaseDetails,
    activeSession: input.derivedState.activeSession,
    selectedSession: input.derivedState.selectedSession,
    playbackActive: input.derivedState.playbackActive,
    liveMonitorActive: input.derivedState.liveMonitorActive,
    selectedSessionBookmarks: input.derivedState.selectedSessionBookmarks,
    bookmarkContexts: input.derivedState.bookmarkContexts,
    selectedSessionReplayFeedbackRecommendation: input.selectedSessionReplayFeedbackRecommendation,
    sessionLabelPlaceholder: input.derivedState.sessionLabelPlaceholder,
    readyToRun: input.derivedState.readyToRun,
    booth: input.booth,
  };
}

export function buildSessionScreenControllerStateSections(input: {
  localState: SessionScreenLocalState;
  actions: SessionScreenControllerActionBindings;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: SessionScreenControllerSlicesResult["selectedSessionReplayFeedbackRecommendation"];
  booth: SessionScreenControllerSlicesResult["booth"];
}): SessionScreenControllerStateSections {
  return {
    localBindings: buildSessionScreenControllerLocalBindings(input.localState),
    actionBindings: buildSessionScreenControllerActionBindings(input.actions),
    derivedBindings: buildSessionScreenControllerDerivedBindings({
      derivedState: input.derivedState,
      selectedSessionReplayFeedbackRecommendation:
        input.selectedSessionReplayFeedbackRecommendation,
      booth: input.booth,
    }),
  };
}

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
  actions: SessionScreenControllerActionBindings;
  selectedSessionReplayFeedbackRecommendation: SessionScreenControllerSlicesResult["selectedSessionReplayFeedbackRecommendation"];
  booth: SessionScreenControllerSlicesResult["booth"];
}): SessionScreenControllerState {
  const sections = buildSessionScreenControllerStateSections({
    localState: input.localState,
    actions: input.actions,
    derivedState: input.derivedState,
    selectedSessionReplayFeedbackRecommendation: input.selectedSessionReplayFeedbackRecommendation,
    booth: input.booth,
  });

  return {
    t: input.t,
    monitor: input.monitor,
    ...sections.localBindings,
    ...sections.actionBindings,
    ...sections.derivedBindings,
  };
}

export function buildSessionScreenControllerStateFromSlices(input: {
  t: AppTranslations;
  monitor: MonitorContextValue;
  localState: SessionScreenLocalState;
  slicesResult: SessionScreenControllerSlicesResult;
}): SessionScreenControllerState {
  return buildSessionScreenControllerStateInput({
    t: input.t,
    monitor: input.monitor,
    localState: input.localState,
    derivedState: input.slicesResult.derivedState,
    actions: input.slicesResult.actions,
    selectedSessionReplayFeedbackRecommendation:
      input.slicesResult.selectedSessionReplayFeedbackRecommendation,
    booth: input.slicesResult.booth,
  });
}
