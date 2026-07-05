import type { PersistedSession } from "../api/sessions";
import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type SessionStartInput = Parameters<UseAppMonitorActionsInput["monitor"]["startSession"]>[1];

export interface AppMonitorGuideActionBindings {
  armTrackBase: (trackId: string | null | undefined) => void;
  armPlaylistBase: (playlistId: string | null | undefined) => void;
  armSessionMusicalBase: (draft?: SessionMonitorDraft) => void;
  primeMonitorGuideTrack: (draft?: SessionMonitorDraft) => void;
}

export interface AppMonitorSessionActionBindings {
  startReplaySession: (session: PersistedSession, replayWindowIndex?: number) => Promise<boolean>;
  startLiveSession: (
    input: SessionStartInput,
    persistedSessionId: string,
    draft?: SessionMonitorDraft & { sourceId?: string | null },
  ) => Promise<boolean>;
  openMonitoredRepo: () => void;
}

export function buildAppMonitorSessionHookInput(
  input: UseAppMonitorActionsInput,
  guideActions: Pick<
    AppMonitorGuideActionBindings,
    "armSessionMusicalBase" | "primeMonitorGuideTrack"
  >,
) {
  return {
    ...input,
    armSessionMusicalBase: guideActions.armSessionMusicalBase,
    primeMonitorGuideTrack: guideActions.primeMonitorGuideTrack,
  };
}

export function buildAppMonitorActionsResult(input: {
  guideActions: AppMonitorGuideActionBindings;
  sessionActions: AppMonitorSessionActionBindings;
}) {
  return {
    ...input.guideActions,
    ...input.sessionActions,
  };
}
