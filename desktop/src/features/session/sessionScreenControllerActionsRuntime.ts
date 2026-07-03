import type { AppTranslations } from "../../i18n/en";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { UseSessionScreenActionsInput } from "./sessionScreenActionsTypes";

export function buildSessionScreenControllerActionsHookInput(input: {
  t: AppTranslations;
  controllerInput: SessionScreenControllerInput;
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionLabel: string;
  directPath: string;
  setCreateError: (value: string | null) => void;
  setCreating: (value: boolean) => void;
  setIsDirectLoading: (value: boolean) => void;
  setSessionLabel: (value: string) => void;
  setSelectedSourceId: (value: string | null) => void;
  setSelectedTrackId: (value: string | null) => void;
  setSelectedPlaylistId: (value: string | null) => void;
  setDirectPath: (value: string) => void;
}): UseSessionScreenActionsInput {
  return {
    t: input.t,
    baseMode: input.baseMode,
    mode: input.mode,
    repositories: input.controllerInput.repositories,
    sessions: input.controllerInput.sessions,
    selectedPlaylistId: input.selectedPlaylistId,
    selectedSourceId: input.selectedSourceId,
    selectedTrackId: input.selectedTrackId,
    sessionLabel: input.sessionLabel,
    directPath: input.directPath,
    onStartSession: input.controllerInput.onStartSession,
    onResume: input.controllerInput.onResume,
    onPlayback: input.controllerInput.onPlayback,
    onReplayBookmark: input.controllerInput.onReplayBookmark,
    onSelectSession: input.controllerInput.onSelectSession,
    setCreateError: input.setCreateError,
    setCreating: input.setCreating,
    setIsDirectLoading: input.setIsDirectLoading,
    setSessionLabel: input.setSessionLabel,
    setSelectedSourceId: input.setSelectedSourceId,
    setSelectedTrackId: input.setSelectedTrackId,
    setSelectedPlaylistId: input.setSelectedPlaylistId,
    setDirectPath: input.setDirectPath,
  };
}
