import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/monitor";
import type { ConnectionTestStatus } from "./connectionsViewModel";

export interface UseConnectionTestControllerInput {
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

export interface ConnectionTestControllerState {
  testStatusById: Record<string, ConnectionTestStatus>;
  testMessageById: Record<string, string>;
  handleTestConnection: (connection: LogSourceConnection) => Promise<void>;
}

export function sleepForConnectionTest(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function buildConnectionTestControllerState(
  input: ConnectionTestControllerState,
): ConnectionTestControllerState {
  return {
    testStatusById: input.testStatusById,
    testMessageById: input.testMessageById,
    handleTestConnection: input.handleTestConnection,
  };
}
