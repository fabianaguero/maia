import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/monitor";
import type { ConnectionTestStatus } from "./connectionsViewModel";
import { testConnectionState } from "./connectionsScreenStateRuntime";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

interface UseConnectionTestControllerInput {
  t: AppTranslations;
  setError: Dispatch<SetStateAction<string | null>>;
  startLogSourceConnection: (payload: {
    connectionId: string;
    sessionId: string;
    startFromBeginning: boolean;
  }) => Promise<unknown>;
  pollStreamSession: (sessionId: string) => Promise<StreamSessionPollResult>;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
  sleepMs?: (ms: number) => Promise<void>;
}

export function useConnectionTestController(input: UseConnectionTestControllerInput) {
  const [testStatusById, setTestStatusById] = useState<Record<string, ConnectionTestStatus>>({});
  const [testMessageById, setTestMessageById] = useState<Record<string, string>>({});
  const testStatusByIdRef = useRef<Record<string, ConnectionTestStatus>>({});
  const testMessageByIdRef = useRef<Record<string, string>>({});

  useEffect(() => {
    testStatusByIdRef.current = testStatusById;
  }, [testStatusById]);

  useEffect(() => {
    testMessageByIdRef.current = testMessageById;
  }, [testMessageById]);

  async function handleTestConnection(connection: LogSourceConnection) {
    await testConnectionState({
      connection,
      t: input.t,
      setError: input.setError,
      currentStatusById: testStatusByIdRef.current,
      currentMessageById: testMessageByIdRef.current,
      setTestStatusById,
      setTestMessageById,
      startLogSourceConnection: input.startLogSourceConnection,
      pollStreamSession: input.pollStreamSession,
      sleep: input.sleepMs ?? sleep,
      stopStreamSession: input.stopStreamSession,
    });
  }

  return {
    testStatusById,
    testMessageById,
    handleTestConnection,
  };
}
