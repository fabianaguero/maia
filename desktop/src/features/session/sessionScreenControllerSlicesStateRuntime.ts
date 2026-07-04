import type { AppTranslations } from "../../i18n/types";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;

export function pickSessionScreenControllerSlicesActionLocalState(
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
  >,
) {
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
  localState: Pick<
    SessionScreenLocalState,
    | "baseMode"
    | "mode"
    | "selectedPlaylistId"
    | "selectedSessionEvents"
    | "selectedSourceId"
    | "selectedTrackId"
  >,
) {
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
  localState: Pick<
    SessionScreenLocalState,
    "setLatestUpdate" | "setSelectedSessionEvents" | "boothBedAudioRef"
  >,
) {
  return {
    setLatestUpdate: localState.setLatestUpdate,
    setSelectedSessionEvents: localState.setSelectedSessionEvents,
    boothBedAudioRef: localState.boothBedAudioRef,
  };
}

export function pickSessionScreenControllerSlicesBoothLocalState(
  localState: Pick<SessionScreenLocalState, "mode" | "latestUpdate">,
) {
  return {
    mode: localState.mode,
    latestUpdate: localState.latestUpdate,
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

export function buildSessionScreenControllerSlicesDerivedDeps(input: {
  controllerInput: SessionScreenControllerInput;
  monitorSnapshot: unknown;
  localState: ReturnType<typeof pickSessionScreenControllerSlicesDerivedLocalState>;
  t: AppTranslations;
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
}) {
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
