import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { LogSourceConnection, StreamSessionPollResult } from "../../types/monitor";

export interface UseConnectionTailControllerInput {
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

export interface ConnectionTailControllerState {
  activeSessionId: string | null;
  activeConnectionId: string | null;
  tailPreview: string[];
  tailStatus: string | null;
  handleStartTail: (connection: LogSourceConnection) => Promise<void>;
  handleStopTail: () => Promise<void>;
}
