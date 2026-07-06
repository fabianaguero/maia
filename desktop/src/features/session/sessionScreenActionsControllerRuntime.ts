import type { SessionScreenActionsState } from "./sessionScreenActionsTypes";

export function buildSessionScreenActionsState<T extends SessionScreenActionsState>(input: T): T {
  return input;
}
