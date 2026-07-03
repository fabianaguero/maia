import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { UseConnectionTailControllerInput } from "./connectionsTailControllerTypes";
import type { UseConnectionTestControllerInput } from "./connectionsTestControllerRuntime";

export function buildConnectionsScreenFormControllerInput(input: {
  t: AppTranslations;
  defaultCloudLookback: string;
}) {
  return input;
}

export function buildConnectionsScreenTailControllerInput(input: {
  t: AppTranslations;
  setError: Dispatch<SetStateAction<string | null>>;
  pollStreamSession: UseConnectionTailControllerInput["pollStreamSession"];
  startLogSourceConnection: UseConnectionTailControllerInput["startLogSourceConnection"];
  stopStreamSession: UseConnectionTailControllerInput["stopStreamSession"];
}) {
  return {
    t: input.t,
    setError: input.setError,
    pollStreamSession: input.pollStreamSession,
    startLogSourceConnection: input.startLogSourceConnection,
    stopStreamSession: input.stopStreamSession,
  };
}

export function buildConnectionsScreenTestControllerInput(input: {
  t: AppTranslations;
  setError: Dispatch<SetStateAction<string | null>>;
  startLogSourceConnection: UseConnectionTestControllerInput["startLogSourceConnection"];
  pollStreamSession: UseConnectionTestControllerInput["pollStreamSession"];
  stopStreamSession: UseConnectionTestControllerInput["stopStreamSession"];
}) {
  return {
    t: input.t,
    setError: input.setError,
    startLogSourceConnection: input.startLogSourceConnection,
    pollStreamSession: input.pollStreamSession,
    stopStreamSession: input.stopStreamSession,
  };
}
