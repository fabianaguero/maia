import { useEffect, useRef, useState } from "react";

import type { LogSourceConnection } from "../../types/monitor";
import { buildConnectionTailStartPlan, buildConnectionTailStopState } from "./connectionsRuntime";
import {
  buildConnectionTailControllerState,
  buildConnectionTailFailureApplyState,
  buildConnectionTailPollApplyState,
} from "./connectionsTailControllerStateRuntime";
import {
  clearConnectionTailPollTimer,
  scheduleConnectionTailPollTimer,
} from "./connectionsTailControllerTimerRuntime";
import type { UseConnectionTailControllerInput } from "./connectionsTailControllerTypes";

export function useConnectionTailController(input: UseConnectionTailControllerInput) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [pendingConnectionId, setPendingConnectionId] = useState<string | null>(null);
  const [tailPhase, setTailPhase] = useState<"starting" | "stopping" | null>(null);
  const [tailPreview, setTailPreview] = useState<string[]>([]);
  const [tailStatus, setTailStatus] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const tailPreviewRef = useRef<string[]>([]);

  useEffect(() => {
    tailPreviewRef.current = tailPreview;
  }, [tailPreview]);

  function clearPollTimer() {
    pollTimerRef.current = clearConnectionTailPollTimer(pollTimerRef.current);
  }

  function applyTailFailure(error: unknown) {
    const nextState = buildConnectionTailFailureApplyState(error);
    input.setError(nextState.error);
    setPendingConnectionId(null);
    setTailPhase(null);
    setActiveSessionId(nextState.activeSessionId);
    setActiveConnectionId(nextState.activeConnectionId);
  }

  function scheduleConnectionPoll(sessionId: string) {
    pollTimerRef.current = scheduleConnectionTailPollTimer({
      currentTimerId: pollTimerRef.current,
      delayMs: input.pollIntervalMs ?? 1500,
      run: async () => {
        try {
          const result = await input.pollStreamSession(sessionId);
          const nextState = buildConnectionTailPollApplyState({
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
      },
    });
  }

  async function handleStartTail(connection: LogSourceConnection) {
    try {
      const startPlan = buildConnectionTailStartPlan({
        t: input.t,
        connectionId: connection.id,
      });
      input.setError(null);
      setPendingConnectionId(connection.id);
      setTailPhase("starting");
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
      setPendingConnectionId(null);
      setTailPhase(null);
      setTailStatus(startPlan.connectedStatus);
      scheduleConnectionPoll(startPlan.nextSessionId);
    } catch (error) {
      applyTailFailure(error);
    }
  }

  async function handleStopTail() {
    const sessionId = activeSessionId;
    clearPollTimer();
    setPendingConnectionId(activeConnectionId);
    setTailPhase("stopping");
    const nextState = buildConnectionTailStopState();
    setActiveSessionId(nextState.activeSessionId);
    setActiveConnectionId(nextState.activeConnectionId);
    setTailStatus(nextState.tailStatus);

    if (sessionId) {
      await input.stopStreamSession(sessionId);
    }

    setPendingConnectionId(null);
    setTailPhase(null);
  }

  useEffect(
    () => () => {
      clearPollTimer();
    },
    [],
  );

  return buildConnectionTailControllerState({
    activeSessionId,
    activeConnectionId,
    pendingConnectionId,
    tailPhase,
    tailPreview,
    tailStatus,
    handleStartTail,
    handleStopTail,
  });
}
