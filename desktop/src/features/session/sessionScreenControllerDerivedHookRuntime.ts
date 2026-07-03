import type { SessionEvent } from "../../api/sessions";
import type { ActiveMonitorSession } from "../monitor/monitorContextTypes";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";

export function buildSessionScreenControllerDerivedHookInput(input: {
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
    controllerInput: input.controllerInput,
    activePlaybackProgress: input.activePlaybackProgress,
    activeSessionId: input.activeSessionId,
    activeSessionMode: input.activeSessionMode,
    baseMode: input.baseMode,
    mode: input.mode,
    monitorHasSession: input.monitorHasSession,
    selectedPlaylistId: input.selectedPlaylistId,
    selectedSessionEvents: input.selectedSessionEvents,
    selectedSourceId: input.selectedSourceId,
    selectedTrackId: input.selectedTrackId,
    sessionPlaceholderFallback: input.sessionPlaceholderFallback,
    templateGenre: input.templateGenre,
    templateLabel: input.templateLabel,
  };
}

export function buildSessionScreenControllerDerivedMemoDeps(input: {
  controllerInput: SessionScreenControllerInput;
  activePlaybackProgress: number | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  monitorSession: ActiveMonitorSession | null;
  selectedPlaylistId: string | null;
  selectedSessionEvents: SessionEvent[];
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionPlaceholderFallback: string;
  selectedTemplateGenre: string | null;
  selectedTemplateLabel: string | null;
  selectedTemplatePresentationGenre: string | null;
  selectedTemplatePresentationLabel: string | null;
}) {
  return [
    input.activePlaybackProgress,
    input.activeSessionId,
    input.activeSessionMode,
    input.controllerInput.playlists,
    input.controllerInput.repositories,
    input.controllerInput.selectedSessionId,
    input.controllerInput.sessionBookmarksBySessionId,
    input.controllerInput.sessions,
    input.controllerInput.tracks,
    input.baseMode,
    input.mode,
    input.monitorSession,
    input.selectedPlaylistId,
    input.selectedSessionEvents,
    input.selectedSourceId,
    input.selectedTemplateGenre,
    input.selectedTemplateLabel,
    input.selectedTemplatePresentationGenre,
    input.selectedTemplatePresentationLabel,
    input.selectedTrackId,
    input.sessionPlaceholderFallback,
  ] as const;
}
