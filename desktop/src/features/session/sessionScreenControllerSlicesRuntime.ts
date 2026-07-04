import type { MutableRefObject } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import { buildSessionBoothViewModel } from "./sessionBoothViewModel";
import {
  buildSessionScreenControllerActionsHookInput,
  buildSessionScreenControllerBoothHookInput,
  buildSessionScreenControllerDerivedHookInput,
  buildSessionScreenControllerDerivedMemoDeps,
  buildSessionScreenBoothViewModelInput,
  buildSessionScreenEffectsHookInput,
} from "./sessionScreenControllerHookRuntime";
import {
  buildSessionBoothInput,
  buildSessionControllerDerivedInput,
  buildSessionScreenActionsInput,
  resolveSessionScreenTemplateSelection,
} from "./sessionScreenControllerRuntime";
import { resolveSessionControllerDerivedState, type SessionControllerDerivedState } from "./sessionScreenRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;
type MonitorSnapshot = ReturnType<typeof buildSessionScreenControllerMonitorSnapshot>;

export function buildSessionScreenControllerSlicesActionsInput(input: {
  t: AppTranslations;
  controllerInput: SessionScreenControllerInput;
  localState: Pick<
    SessionScreenLocalState,
    | "baseMode"
    | "mode"
    | "selectedPlaylistId"
    | "selectedSourceId"
    | "selectedTrackId"
    | "sessionLabel"
    | "directPath"
    | "setCreateError"
    | "setCreating"
    | "setIsDirectLoading"
    | "setSessionLabel"
    | "setSelectedSourceId"
    | "setSelectedTrackId"
    | "setSelectedPlaylistId"
    | "setDirectPath"
  >;
}) {
  return buildSessionScreenActionsInput(
    buildSessionScreenControllerActionsHookInput({
      t: input.t,
      controllerInput: input.controllerInput,
      baseMode: input.localState.baseMode,
      mode: input.localState.mode,
      selectedPlaylistId: input.localState.selectedPlaylistId,
      selectedSourceId: input.localState.selectedSourceId,
      selectedTrackId: input.localState.selectedTrackId,
      sessionLabel: input.localState.sessionLabel,
      directPath: input.localState.directPath,
      setCreateError: input.localState.setCreateError,
      setCreating: input.localState.setCreating,
      setIsDirectLoading: input.localState.setIsDirectLoading,
      setSessionLabel: input.localState.setSessionLabel,
      setSelectedSourceId: input.localState.setSelectedSourceId,
      setSelectedTrackId: input.localState.setSelectedTrackId,
      setSelectedPlaylistId: input.localState.setSelectedPlaylistId,
      setDirectPath: input.localState.setDirectPath,
    }),
  );
}

export function resolveSessionScreenControllerSlicesTemplateSelection(input: {
  selectedTemplateId: string;
  t: AppTranslations;
}) {
  return resolveSessionScreenTemplateSelection(input);
}

export function resolveSessionScreenControllerSlicesDerivedState(input: {
  t: AppTranslations;
  controllerInput: SessionScreenControllerInput;
  monitorSnapshot: Pick<MonitorSnapshot, "monitorHasSession" | "monitorSession">;
  localState: Pick<
    SessionScreenLocalState,
    | "baseMode"
    | "mode"
    | "selectedPlaylistId"
    | "selectedSessionEvents"
    | "selectedSourceId"
    | "selectedTrackId"
  >;
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
}) {
  return resolveSessionControllerDerivedState(
    buildSessionControllerDerivedInput(
      buildSessionScreenControllerDerivedHookInput({
        controllerInput: input.controllerInput,
        activePlaybackProgress: input.controllerInput.activePlaybackProgress,
        activeSessionId: input.controllerInput.activeSessionId,
        activeSessionMode: input.controllerInput.activeSessionMode,
        baseMode: input.localState.baseMode,
        mode: input.localState.mode,
        monitorHasSession: input.monitorSnapshot.monitorHasSession,
        selectedPlaylistId: input.localState.selectedPlaylistId,
        selectedSessionEvents: input.localState.selectedSessionEvents,
        selectedSourceId: input.localState.selectedSourceId,
        selectedTrackId: input.localState.selectedTrackId,
        sessionPlaceholderFallback: input.t.session.sessionPlaceholder,
        templateGenre: input.selectedTemplateGenre,
        templateLabel: input.selectedTemplateLabel,
      }),
    ),
  );
}

export function buildSessionScreenControllerSlicesDerivedMemoDeps(input: {
  t: AppTranslations;
  controllerInput: SessionScreenControllerInput;
  monitorSnapshot: Pick<MonitorSnapshot, "monitorSession">;
  localState: Pick<
    SessionScreenLocalState,
    | "baseMode"
    | "mode"
    | "selectedPlaylistId"
    | "selectedSessionEvents"
    | "selectedSourceId"
    | "selectedTrackId"
  >;
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
  selectedTemplatePresentationGenre: string | null;
  selectedTemplatePresentationLabel: string | null;
}) {
  return buildSessionScreenControllerDerivedMemoDeps({
    controllerInput: input.controllerInput,
    activePlaybackProgress: input.controllerInput.activePlaybackProgress,
    activeSessionId: input.controllerInput.activeSessionId,
    activeSessionMode: input.controllerInput.activeSessionMode,
    baseMode: input.localState.baseMode,
    mode: input.localState.mode,
    monitorSession: input.monitorSnapshot.monitorSession,
    selectedPlaylistId: input.localState.selectedPlaylistId,
    selectedSessionEvents: input.localState.selectedSessionEvents,
    selectedSourceId: input.localState.selectedSourceId,
    selectedTrackId: input.localState.selectedTrackId,
    sessionPlaceholderFallback: input.t.session.sessionPlaceholder,
    selectedTemplateGenre: input.selectedTemplateGenre,
    selectedTemplateLabel: input.selectedTemplateLabel,
    selectedTemplatePresentationGenre: input.selectedTemplatePresentationGenre,
    selectedTemplatePresentationLabel: input.selectedTemplatePresentationLabel,
  });
}

export function buildSessionScreenControllerSlicesEffectsInput(input: {
  monitorSnapshot: Pick<MonitorSnapshot, "monitorSessionId" | "subscribeToMonitor">;
  localState: Pick<
    SessionScreenLocalState,
    | "setLatestUpdate"
    | "setSelectedSessionEvents"
    | "boothBedAudioRef"
  >;
  derivedState: Pick<SessionControllerDerivedState, "selectedSessionIdForEvents" | "activeBedUrl">;
}) {
  return buildSessionScreenEffectsHookInput({
    monitorSessionId: input.monitorSnapshot.monitorSessionId,
    subscribeToMonitor: input.monitorSnapshot.subscribeToMonitor,
    setLatestUpdate: input.localState.setLatestUpdate,
    selectedSessionIdForEvents: input.derivedState.selectedSessionIdForEvents,
    setSelectedSessionEvents: input.localState.setSelectedSessionEvents,
    activeBedUrl: input.derivedState.activeBedUrl,
    boothBedAudioRef: input.localState.boothBedAudioRef as MutableRefObject<HTMLAudioElement | null>,
  });
}

export function buildSessionScreenControllerSlicesBooth(input: {
  t: AppTranslations;
  monitorSnapshot: Pick<
    MonitorSnapshot,
    | "monitorSession"
    | "monitorMetrics"
    | "isPlaybackPaused"
    | "playbackEventIndex"
    | "playbackEventCount"
  >;
  localState: Pick<SessionScreenLocalState, "mode" | "latestUpdate">;
  derivedState: SessionControllerDerivedState;
}) {
  return buildSessionBoothViewModel(
    buildSessionBoothInput(
      buildSessionScreenBoothViewModelInput(
        buildSessionScreenControllerBoothHookInput({
          t: input.t,
          mode: input.localState.mode,
          latestUpdate: input.localState.latestUpdate as LiveLogStreamUpdate | null,
          derivedState: input.derivedState,
          monitorSnapshot: input.monitorSnapshot,
        }),
      ),
    ),
  );
}

export function buildSessionScreenControllerSlicesResult<
  TActions,
  TSelectedTemplate,
  TSelectedTemplatePresentation,
  TRecommendation,
  TBooth,
>(input: {
  actions: TActions;
  selectedTemplate: TSelectedTemplate;
  selectedTemplatePresentation: TSelectedTemplatePresentation;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: TRecommendation;
  booth: TBooth;
}): {
  actions: TActions;
  selectedTemplate: TSelectedTemplate;
  selectedTemplatePresentation: TSelectedTemplatePresentation;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: TRecommendation;
  booth: TBooth;
} {
  return input;
}
