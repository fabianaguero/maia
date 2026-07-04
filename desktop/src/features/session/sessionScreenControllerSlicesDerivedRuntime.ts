import type { AppTranslations } from "../../i18n/types";
import {
  buildSessionScreenControllerDerivedHookInput,
  buildSessionScreenControllerDerivedMemoDeps,
} from "./sessionScreenControllerHookRuntime";
import {
  buildSessionControllerDerivedInput,
  resolveSessionScreenTemplateSelection,
} from "./sessionScreenControllerRuntime";
import {
  resolveSessionControllerDerivedState,
  type SessionControllerDerivedState,
} from "./sessionScreenRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;
type MonitorSnapshot = ReturnType<typeof buildSessionScreenControllerMonitorSnapshot>;

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

export type { SessionControllerDerivedState };
