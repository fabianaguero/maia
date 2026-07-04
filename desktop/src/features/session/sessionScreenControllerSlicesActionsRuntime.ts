import type { AppTranslations } from "../../i18n/types";
import {
  buildSessionScreenControllerActionsHookInput,
} from "./sessionScreenControllerHookRuntime";
import { buildSessionScreenActionsInput } from "./sessionScreenControllerRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;

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
