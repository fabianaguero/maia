import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";

export function buildSessionScreenHeaderProps(
  input: Pick<BuildSessionScreenViewModelInput, "sessionsCount" | "controller">,
) {
  return {
    sessionsCount: input.sessionsCount,
    activeSession: input.controller.activeSession ?? null,
  };
}
