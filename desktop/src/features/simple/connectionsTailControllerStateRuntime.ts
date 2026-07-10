import {
  buildConnectionTailFailureState,
  buildConnectionTailPollViewState,
  type ConnectionTailFailureState,
  type ConnectionTailPollViewState,
} from "./connectionsRuntime";
import type { ConnectionTailControllerState } from "./connectionsTailControllerTypes";

export function resolveConnectionTailErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function buildConnectionTailFailureApplyState(error: unknown): ConnectionTailFailureState {
  return buildConnectionTailFailureState(resolveConnectionTailErrorMessage(error));
}

export function buildConnectionTailPollApplyState(input: {
  t: Parameters<typeof buildConnectionTailPollViewState>[0]["t"];
  currentPreview: string[];
  result: Parameters<typeof buildConnectionTailPollViewState>[0]["result"];
}): ConnectionTailPollViewState {
  return buildConnectionTailPollViewState(input);
}

export function buildConnectionTailControllerState(
  input: ConnectionTailControllerState,
): ConnectionTailControllerState {
  return {
    activeSessionId: input.activeSessionId,
    activeConnectionId: input.activeConnectionId,
    pendingConnectionId: input.pendingConnectionId,
    tailPhase: input.tailPhase,
    tailPreview: input.tailPreview,
    tailStatus: input.tailStatus,
    handleStartTail: input.handleStartTail,
    handleStopTail: input.handleStopTail,
  };
}
