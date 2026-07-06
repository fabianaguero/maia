import type { AppTranslations } from "../../i18n/types";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;
type MonitorSnapshot = ReturnType<typeof buildSessionScreenControllerMonitorSnapshot>;

export interface SessionScreenControllerSlicesDerivedArgsInput {
  t: AppTranslations;
  controllerInput: SessionScreenControllerInput;
  monitorSnapshot: Pick<MonitorSnapshot, "monitorSession"> &
    Partial<Pick<MonitorSnapshot, "monitorHasSession">>;
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
}

export interface SessionScreenControllerSlicesDerivedArgs {
  controllerInput: SessionScreenControllerInput;
  activePlaybackProgress: number | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  baseMode: SessionScreenLocalState["baseMode"];
  mode: SessionScreenLocalState["mode"];
  monitorHasSession: boolean;
  monitorSession: MonitorSnapshot["monitorSession"];
  selectedPlaylistId: string | null;
  selectedSessionEvents: SessionScreenLocalState["selectedSessionEvents"];
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionPlaceholderFallback: string;
  templateGenre: string | null;
  templateLabel: string | null;
}

export interface SessionScreenControllerSlicesDerivedMemoInput {
  selectedTemplatePresentationGenre: string | null;
  selectedTemplatePresentationLabel: string | null;
}

export interface SessionScreenControllerSlicesDerivedResolution<TStateInput, TState> {
  args: SessionScreenControllerSlicesDerivedArgs;
  stateInput: TStateInput;
  derivedState: TState;
}

export interface SessionScreenControllerSlicesDerivedMemoResolution<TMemoInput, TDeps> {
  args: SessionScreenControllerSlicesDerivedArgs;
  memoInput: TMemoInput;
  deps: TDeps;
}
