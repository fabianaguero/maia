import { useCallback } from "react";

import type { PersistedSession } from "../../api/sessions";
import {
  runSessionCreateAction,
  runSessionDirectLaunchAction,
  runSessionPlaybackAction,
  runSessionReplayBookmarkAction,
  runSessionResumeAction,
} from "./sessionScreenActionRuntime";
import { buildSessionScreenActionsState } from "./sessionScreenActionsControllerRuntime";
import type { UseSessionScreenActionsInput } from "./sessionScreenActionsTypes";

export function useSessionScreenActions(input: UseSessionScreenActionsInput) {
  const handleCreateSession = useCallback(async () => {
    await runSessionCreateAction(input);
  }, [input]);

  const handleDirectLaunch = useCallback(async () => {
    await runSessionDirectLaunchAction(input);
  }, [input]);

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      await runSessionResumeAction(input, sessionId);
    },
    [input],
  );

  const handlePlaybackSession = useCallback(
    async (session: PersistedSession) => {
      await runSessionPlaybackAction({
        session,
        t: input.t,
        onPlayback: input.onPlayback,
        onSelectSession: input.onSelectSession,
        setCreateError: input.setCreateError,
      });
    },
    [input],
  );

  const handleReplayBookmark = useCallback(
    async (session: PersistedSession, replayWindowIndex: number) => {
      await runSessionReplayBookmarkAction({
        session,
        replayWindowIndex,
        t: input.t,
        onReplayBookmark: input.onReplayBookmark,
        onSelectSession: input.onSelectSession,
        setCreateError: input.setCreateError,
      });
    },
    [input],
  );

  return buildSessionScreenActionsState({
    handleCreateSession,
    handleDirectLaunch,
    handleResumeSession,
    handlePlaybackSession,
    handleReplayBookmark,
  });
}
