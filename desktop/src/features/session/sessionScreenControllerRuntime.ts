import type { AppTranslations } from "../../i18n/types";
import {
  DEFAULT_SOURCE_TEMPLATE_ID,
  resolveSourceTemplatePresentation,
  SOURCE_TEMPLATES,
} from "../../config/sourceTemplates";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type {
  SessionScreenControllerInput,
  SessionScreenControllerState,
} from "./sessionScreenControllerTypes";
import type { UseSessionScreenActionsInput } from "./sessionScreenActionsTypes";
import type { BuildSessionBoothViewModelInput } from "./sessionBoothViewModelTypes";
import type { SessionEvent } from "../../api/sessions";

export function resolveInitialSessionBaseMode(trackCount: number): SessionBaseMode {
  return trackCount > 0 ? "track" : "playlist";
}

export function resolveSessionScreenTemplateSelection(input: {
  selectedTemplateId: string;
  t: AppTranslations;
}) {
  const selectedTemplate =
    SOURCE_TEMPLATES.find((template) => template.id === input.selectedTemplateId) ?? null;
  const selectedTemplatePresentation = selectedTemplate
    ? resolveSourceTemplatePresentation(selectedTemplate, input.t)
    : null;

  return {
    selectedTemplate,
    selectedTemplatePresentation,
  };
}

export function resolveSessionScreenSelectedTemplateId(
  selectedTemplateId: string | null | undefined,
): string {
  return selectedTemplateId ?? DEFAULT_SOURCE_TEMPLATE_ID;
}

export function buildSessionScreenControllerState<T extends SessionScreenControllerState>(
  input: T,
): T {
  return input;
}

export function buildSessionScreenActionsInput(input: {
  t: AppTranslations;
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  repositories: SessionScreenControllerInput["repositories"];
  sessions: SessionScreenControllerInput["sessions"];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionLabel: string;
  directPath: string;
  onStartSession: SessionScreenControllerInput["onStartSession"];
  onResume: SessionScreenControllerInput["onResume"];
  onPlayback: SessionScreenControllerInput["onPlayback"];
  onReplayBookmark: SessionScreenControllerInput["onReplayBookmark"];
  onSelectSession: SessionScreenControllerInput["onSelectSession"];
  setCreateError: (value: string | null) => void;
  setCreating: (value: boolean) => void;
  setIsDirectLoading: (value: boolean) => void;
  setSessionLabel: (value: string) => void;
  setSelectedSourceId: (value: string | null) => void;
  setSelectedTrackId: (value: string | null) => void;
  setSelectedPlaylistId: (value: string | null) => void;
  setDirectPath: (value: string) => void;
}): UseSessionScreenActionsInput {
  return input;
}

export function buildSessionControllerDerivedInput(input: {
  controllerInput: SessionScreenControllerInput;
  activePlaybackProgress: number | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  monitorHasSession: boolean;
  selectedPlaylistId: string | null;
  selectedSessionEvents: SessionEvent[];
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionPlaceholderFallback: string;
  templateGenre: string | null;
  templateLabel: string | null;
}) {
  return {
    activePlaybackProgress: input.activePlaybackProgress,
    activeSessionId: input.activeSessionId,
    activeSessionMode: input.activeSessionMode,
    baseMode: input.baseMode,
    mode: input.mode,
    monitorHasSession: input.monitorHasSession,
    playlists: input.controllerInput.playlists,
    repositories: input.controllerInput.repositories,
    selectedPlaylistId: input.selectedPlaylistId,
    selectedSessionEvents: input.selectedSessionEvents,
    selectedSessionId: input.controllerInput.selectedSessionId,
    selectedSourceId: input.selectedSourceId,
    selectedTrackId: input.selectedTrackId,
    sessionBookmarksBySessionId: input.controllerInput.sessionBookmarksBySessionId,
    sessionPlaceholderFallback: input.sessionPlaceholderFallback,
    templateGenre: input.templateGenre,
    templateLabel: input.templateLabel,
    sessions: input.controllerInput.sessions,
    tracks: input.controllerInput.tracks,
  };
}

export function buildSessionBoothInput(
  input: BuildSessionBoothViewModelInput,
): BuildSessionBoothViewModelInput {
  return input;
}
