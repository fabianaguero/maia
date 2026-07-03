import { useEffect, useRef, useState } from "react";

import type { LogSourceConnection } from "../../types/monitor";
import type { ConnectionTestStatus } from "./connectionsViewModel";
import { testConnectionState } from "./connectionsScreenStateRuntime";
import {
  buildConnectionTestControllerState,
  sleepForConnectionTest,
  type UseConnectionTestControllerInput,
} from "./connectionsTestControllerRuntime";

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
      sleep: input.sleepMs ?? sleepForConnectionTest,
      stopStreamSession: input.stopStreamSession,
    });
  }

  return buildConnectionTestControllerState({
    testStatusById,
    testMessageById,
    handleTestConnection,
  });
}
