import type { AppTranslations } from "../../i18n/types";
import type {
  SessionScreenControllerSlicesActionLocalState,
  SessionScreenControllerSlicesBoothLocalState,
  SessionScreenControllerSlicesDerivedDepsInput,
  SessionScreenControllerSlicesDerivedLocalState,
  SessionScreenControllerSlicesEffectsLocalState,
  SessionScreenControllerSlicesLocalStateGroups,
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
}) {
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
    selectedTemplateGenre,
    selectedTemplateLabel,
  };
}

export function buildSessionScreenControllerSlicesDerivedDeps(
  input: SessionScreenControllerSlicesDerivedDepsInput,
) {
  return [
    input.controllerInput,
    input.monitorSnapshot,
    input.localState.baseMode,
    input.localState.mode,
    input.localState.selectedPlaylistId,
    input.localState.selectedSessionEvents,
    input.localState.selectedSourceId,
    input.localState.selectedTrackId,
    input.t,
    input.selectedTemplateGenre,
    input.selectedTemplateLabel,
  ] as const;
}
