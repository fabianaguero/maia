import type { AppTranslations } from "../../i18n/types";
import type {
  SessionScreenControllerSlicesActionLocalState,
  SessionScreenControllerSlicesBoothLocalState,
  SessionScreenControllerSlicesDerivedDepsInput,
  SessionScreenControllerSlicesDerivedDepsState,
  SessionScreenControllerSlicesDerivedLocalState,
  SessionScreenControllerSlicesEffectsLocalState,
  SessionScreenControllerSlicesLocalStateGroups,
  SessionScreenControllerTemplateMetaState,
  SessionScreenControllerTemplateState,
} from "./sessionScreenControllerSlicesStateContracts";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;

export function pickSessionScreenControllerSlicesActionLocalState(
  localState: SessionScreenControllerSlicesActionLocalState,
): SessionScreenControllerSlicesActionLocalState {
  return {
    baseMode: localState.baseMode,
    mode: localState.mode,
    selectedPlaylistId: localState.selectedPlaylistId,
    selectedSourceId: localState.selectedSourceId,
    selectedTrackId: localState.selectedTrackId,
    sessionLabel: localState.sessionLabel,
    directPath: localState.directPath,
    setCreateError: localState.setCreateError,
    setCreating: localState.setCreating,
    setIsDirectLoading: localState.setIsDirectLoading,
    setSessionLabel: localState.setSessionLabel,
    setSelectedSourceId: localState.setSelectedSourceId,
    setSelectedTrackId: localState.setSelectedTrackId,
    setSelectedPlaylistId: localState.setSelectedPlaylistId,
    setDirectPath: localState.setDirectPath,
  };
}

export function pickSessionScreenControllerSlicesDerivedLocalState(
  localState: SessionScreenControllerSlicesDerivedLocalState,
): SessionScreenControllerSlicesDerivedLocalState {
  return {
    baseMode: localState.baseMode,
    mode: localState.mode,
    selectedPlaylistId: localState.selectedPlaylistId,
    selectedSessionEvents: localState.selectedSessionEvents,
    selectedSourceId: localState.selectedSourceId,
    selectedTrackId: localState.selectedTrackId,
  };
}

export function pickSessionScreenControllerSlicesEffectsLocalState(
  localState: SessionScreenControllerSlicesEffectsLocalState,
): SessionScreenControllerSlicesEffectsLocalState {
  return {
    setLatestUpdate: localState.setLatestUpdate,
    setSelectedSessionEvents: localState.setSelectedSessionEvents,
    boothBedAudioRef: localState.boothBedAudioRef,
  };
}

export function pickSessionScreenControllerSlicesBoothLocalState(
  localState: SessionScreenControllerSlicesBoothLocalState,
): SessionScreenControllerSlicesBoothLocalState {
  return {
    mode: localState.mode,
    latestUpdate: localState.latestUpdate,
  };
}

export function buildSessionScreenControllerSlicesLocalState(
  localState: SessionScreenLocalState,
): SessionScreenControllerSlicesLocalStateGroups {
  return {
    actionLocalState: pickSessionScreenControllerSlicesActionLocalState(localState),
    derivedLocalState: pickSessionScreenControllerSlicesDerivedLocalState(localState),
    effectsLocalState: pickSessionScreenControllerSlicesEffectsLocalState(localState),
    boothLocalState: pickSessionScreenControllerSlicesBoothLocalState(localState),
  };
}

export function resolveSessionScreenControllerTemplateMeta(input: {
  selectedTemplate: { genre?: string | null; label?: string | null } | null;
  selectedTemplatePresentation: { genre?: string | null; label?: string | null } | null;
}): SessionScreenControllerTemplateMetaState {
  return {
    selectedTemplateGenre:
      input.selectedTemplatePresentation?.genre ?? input.selectedTemplate?.genre ?? null,
    selectedTemplateLabel:
      input.selectedTemplatePresentation?.label ?? input.selectedTemplate?.label ?? null,
  };
}

export function buildSessionScreenControllerTemplateState(input: {
  selectedTemplateId: string;
  t: AppTranslations;
  resolveTemplateSelection: (input: { selectedTemplateId: string; t: AppTranslations }) => {
    selectedTemplate: { genre?: string | null; label?: string | null } | null;
    selectedTemplatePresentation: { genre?: string | null; label?: string | null } | null;
  };
}): SessionScreenControllerTemplateState {
  const { selectedTemplate, selectedTemplatePresentation } = input.resolveTemplateSelection({
    selectedTemplateId: input.selectedTemplateId,
    t: input.t,
  });
  const { selectedTemplateGenre, selectedTemplateLabel } =
    resolveSessionScreenControllerTemplateMeta({
      selectedTemplate,
      selectedTemplatePresentation,
    });

  return {
    selectedTemplate,
    selectedTemplatePresentation,
    ...buildSessionScreenControllerTemplateMetaState({
      selectedTemplateGenre,
      selectedTemplateLabel,
    }),
  };
}

export function buildSessionScreenControllerTemplateMetaState(
  input: SessionScreenControllerTemplateMetaState,
): SessionScreenControllerTemplateMetaState {
  return {
    selectedTemplateGenre: input.selectedTemplateGenre,
    selectedTemplateLabel: input.selectedTemplateLabel,
  };
}

export function buildSessionScreenControllerSlicesDerivedDepsState(
  input: SessionScreenControllerSlicesDerivedDepsInput,
): SessionScreenControllerSlicesDerivedDepsState {
  return {
    controllerInput: input.controllerInput,
    monitorSnapshot: input.monitorSnapshot,
    baseMode: input.localState.baseMode,
    mode: input.localState.mode,
    selectedPlaylistId: input.localState.selectedPlaylistId,
    selectedSessionEvents: input.localState.selectedSessionEvents,
    selectedSourceId: input.localState.selectedSourceId,
    selectedTrackId: input.localState.selectedTrackId,
    t: input.t,
    selectedTemplateGenre: input.selectedTemplateGenre,
    selectedTemplateLabel: input.selectedTemplateLabel,
  };
}

export function buildSessionScreenControllerSlicesDerivedDeps(
  input: SessionScreenControllerSlicesDerivedDepsInput,
) {
  const state = buildSessionScreenControllerSlicesDerivedDepsState(input);

  return [
    state.controllerInput,
    state.monitorSnapshot,
    state.baseMode,
    state.mode,
    state.selectedPlaylistId,
    state.selectedSessionEvents,
    state.selectedSourceId,
    state.selectedTrackId,
    state.t,
    state.selectedTemplateGenre,
    state.selectedTemplateLabel,
  ] as const;
}
