import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";

export function buildSessionScreenHeaderState(
  input: Pick<BuildSessionScreenViewModelInput, "sessionsCount" | "controller">,
) {
  return {
    sessionsCount: input.sessionsCount,
    activeSession: input.controller.activeSession ?? null,
  };
}

export function buildSessionScreenHeaderProps(
  input: Pick<BuildSessionScreenViewModelInput, "sessionsCount" | "controller">,
) {
  return buildSessionScreenHeaderState(input);
}
