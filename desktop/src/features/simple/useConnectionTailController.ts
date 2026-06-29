import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/monitor";
import {
  buildConnectionTailFailureState,
  buildConnectionTailPollViewState,
  buildConnectionTailStartPlan,
  buildConnectionTailStopState,
} from "./connectionsRuntime";

interface UseConnectionTailControllerInput {
  t: AppTranslations;
  setError: Dispatch<SetStateAction<string | null>>;
  pollStreamSession: (sessionId: string) => Promise<StreamSessionPollResult>;
  startLogSourceConnection: (payload: {
    connectionId: string;
    sessionId: string;
    startFromBeginning: boolean;
  }) => Promise<unknown>;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
  pollIntervalMs?: number;
}

export function useConnectionTailController(input: UseConnectionTailControllerInput) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [tailPreview, setTailPreview] = useState<string[]>([]);
  const [tailStatus, setTailStatus] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const tailPreviewRef = useRef<string[]>([]);

  useEffect(() => {
    tailPreviewRef.current = tailPreview;
  }, [tailPreview]);

  function clearPollTimer() {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  function applyTailFailure(error: unknown) {
    const nextState = buildConnectionTailFailureState(
      error instanceof Error ? error.message : String(error),
    );
    input.setError(nextState.error);
    setActiveSessionId(nextState.activeSessionId);
    setActiveConnectionId(nextState.activeConnectionId);
  }

  function scheduleConnectionPoll(sessionId: string) {
    clearPollTimer();
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const result = await input.pollStreamSession(sessionId);
        const nextState = buildConnectionTailPollViewState({
          t: input.t,
          currentPreview: tailPreviewRef.current,
          result,
        });
        setTailPreview(nextState.tailPreview);
        setTailStatus(nextState.tailStatus);
        scheduleConnectionPoll(sessionId);
      } catch (error) {
        applyTailFailure(error);
      }
    }, input.pollIntervalMs ?? 1500);
  }

  async function handleStartTail(connection: LogSourceConnection) {
    try {
      const startPlan = buildConnectionTailStartPlan({
        t: input.t,
        connectionId: connection.id,
      });
      input.setError(null);
      setTailPreview(startPlan.clearedPreview);
      setTailStatus(startPlan.openingStatus);
      clearPollTimer();

      if (activeSessionId) {
        await input.stopStreamSession(activeSessionId);
      }

      await input.startLogSourceConnection({
        connectionId: connection.id,
        sessionId: startPlan.nextSessionId,
        startFromBeginning: false,
      });

      setActiveSessionId(startPlan.nextSessionId);
      setActiveConnectionId(startPlan.activeConnectionId);
      setTailStatus(startPlan.connectedStatus);
      scheduleConnectionPoll(startPlan.nextSessionId);
    } catch (error) {
      applyTailFailure(error);
    }
  }

  async function handleStopTail() {
    const sessionId = activeSessionId;
    clearPollTimer();
    const nextState = buildConnectionTailStopState();
    setActiveSessionId(nextState.activeSessionId);
    setActiveConnectionId(nextState.activeConnectionId);
    setTailStatus(nextState.tailStatus);

    if (sessionId) {
      await input.stopStreamSession(sessionId);
    }
  }

  useEffect(
    () => () => {
      clearPollTimer();
    },
    [],
  );

  return {
    activeSessionId,
    activeConnectionId,
    tailPreview,
    tailStatus,
    handleStartTail,
    handleStopTail,
  };
}
