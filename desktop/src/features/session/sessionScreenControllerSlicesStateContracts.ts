import type { AppTranslations } from "../../i18n/types";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;

export type SessionScreenControllerSlicesActionLocalState = Pick<
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

export type SessionScreenControllerSlicesDerivedLocalState = Pick<
  SessionScreenLocalState,
  | "baseMode"
  | "mode"
  | "selectedPlaylistId"
  | "selectedSessionEvents"
  | "selectedSourceId"
  | "selectedTrackId"
>;

export type SessionScreenControllerSlicesEffectsLocalState = Pick<
  SessionScreenLocalState,
  "setLatestUpdate" | "setSelectedSessionEvents" | "boothBedAudioRef"
>;

export type SessionScreenControllerSlicesBoothLocalState = Pick<
  SessionScreenLocalState,
  "mode" | "latestUpdate"
>;

export interface SessionScreenControllerSlicesLocalStateGroups {
  actionLocalState: SessionScreenControllerSlicesActionLocalState;
  derivedLocalState: SessionScreenControllerSlicesDerivedLocalState;
  effectsLocalState: SessionScreenControllerSlicesEffectsLocalState;
  boothLocalState: SessionScreenControllerSlicesBoothLocalState;
}

export interface SessionScreenControllerTemplateState {
  selectedTemplate: { genre?: string | null; label?: string | null } | null;
  selectedTemplatePresentation: { genre?: string | null; label?: string | null } | null;
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
}

export interface SessionScreenControllerSlicesDerivedDepsInput {
  controllerInput: SessionScreenControllerInput;
  monitorSnapshot: unknown;
  localState: SessionScreenControllerSlicesDerivedLocalState;
  t: AppTranslations;
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
}
