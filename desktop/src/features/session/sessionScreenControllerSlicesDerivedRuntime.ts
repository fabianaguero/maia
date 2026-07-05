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
import type {
  SessionScreenControllerSlicesDerivedArgs,
  SessionScreenControllerSlicesDerivedArgsInput,
  SessionScreenControllerSlicesDerivedMemoInput,
} from "./sessionScreenControllerSlicesDerivedContracts";

export function buildSessionScreenControllerSlicesDerivedArgs(
  input: SessionScreenControllerSlicesDerivedArgsInput,
): SessionScreenControllerSlicesDerivedArgs {
  return {
    controllerInput: input.controllerInput,
    activePlaybackProgress: input.controllerInput.activePlaybackProgress,
    activeSessionId: input.controllerInput.activeSessionId,
    activeSessionMode: input.controllerInput.activeSessionMode,
    baseMode: input.localState.baseMode,
    mode: input.localState.mode,
    monitorHasSession: input.monitorSnapshot.monitorHasSession ?? false,
    monitorSession: input.monitorSnapshot.monitorSession,
    selectedPlaylistId: input.localState.selectedPlaylistId,
    selectedSessionEvents: input.localState.selectedSessionEvents,
    selectedSourceId: input.localState.selectedSourceId,
    selectedTrackId: input.localState.selectedTrackId,
    sessionPlaceholderFallback: input.t.session.sessionPlaceholder,
    templateGenre: input.selectedTemplateGenre,
    templateLabel: input.selectedTemplateLabel,
  };
}

export function buildSessionScreenControllerSlicesDerivedStateInput(
  args: SessionScreenControllerSlicesDerivedArgs,
) {
  return buildSessionControllerDerivedInput(
    buildSessionScreenControllerDerivedHookInput({
      controllerInput: args.controllerInput,
      activePlaybackProgress: args.activePlaybackProgress,
      activeSessionId: args.activeSessionId,
      activeSessionMode: args.activeSessionMode,
      baseMode: args.baseMode,
      mode: args.mode,
      monitorHasSession: args.monitorHasSession,
      selectedPlaylistId: args.selectedPlaylistId,
      selectedSessionEvents: args.selectedSessionEvents,
      selectedSourceId: args.selectedSourceId,
      selectedTrackId: args.selectedTrackId,
      sessionPlaceholderFallback: args.sessionPlaceholderFallback,
      templateGenre: args.templateGenre,
      templateLabel: args.templateLabel,
    }),
  );
}

export function buildSessionScreenControllerSlicesDerivedMemoInput(
  args: SessionScreenControllerSlicesDerivedArgs,
  input: SessionScreenControllerSlicesDerivedMemoInput,
) {
  return {
    controllerInput: args.controllerInput,
    activePlaybackProgress: args.activePlaybackProgress,
    activeSessionId: args.activeSessionId,
    activeSessionMode: args.activeSessionMode,
    baseMode: args.baseMode,
    mode: args.mode,
    monitorSession: args.monitorSession,
    selectedPlaylistId: args.selectedPlaylistId,
    selectedSessionEvents: args.selectedSessionEvents,
    selectedSourceId: args.selectedSourceId,
    selectedTrackId: args.selectedTrackId,
    sessionPlaceholderFallback: args.sessionPlaceholderFallback,
    selectedTemplateGenre: args.templateGenre,
    selectedTemplateLabel: args.templateLabel,
    selectedTemplatePresentationGenre: input.selectedTemplatePresentationGenre,
    selectedTemplatePresentationLabel: input.selectedTemplatePresentationLabel,
  };
}

export function resolveSessionScreenControllerSlicesTemplateSelection(input: {
  selectedTemplateId: string;
  t: AppTranslations;
}) {
  return resolveSessionScreenTemplateSelection(input);
}

export function resolveSessionScreenControllerSlicesDerivedState(input: {
  t: AppTranslations;
  controllerInput: SessionScreenControllerSlicesDerivedArgsInput["controllerInput"];
  monitorSnapshot: SessionScreenControllerSlicesDerivedArgsInput["monitorSnapshot"];
  localState: SessionScreenControllerSlicesDerivedArgsInput["localState"];
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
}) {
  const args = buildSessionScreenControllerSlicesDerivedArgs(input);

  return resolveSessionControllerDerivedState(
    buildSessionScreenControllerSlicesDerivedStateInput(args),
  );
}

export function buildSessionScreenControllerSlicesDerivedMemoDeps(input: {
  t: AppTranslations;
  controllerInput: SessionScreenControllerSlicesDerivedArgsInput["controllerInput"];
  monitorSnapshot: Pick<
    SessionScreenControllerSlicesDerivedArgsInput["monitorSnapshot"],
    "monitorSession"
  >;
  localState: SessionScreenControllerSlicesDerivedArgsInput["localState"];
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
  selectedTemplatePresentationGenre: string | null;
  selectedTemplatePresentationLabel: string | null;
}) {
  const args = buildSessionScreenControllerSlicesDerivedArgs(input);

  return buildSessionScreenControllerDerivedMemoDeps(
    buildSessionScreenControllerSlicesDerivedMemoInput(args, {
      selectedTemplatePresentationGenre: input.selectedTemplatePresentationGenre,
      selectedTemplatePresentationLabel: input.selectedTemplatePresentationLabel,
    }),
  );
}

export type { SessionControllerDerivedState };
