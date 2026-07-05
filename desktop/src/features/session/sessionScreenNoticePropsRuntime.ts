import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";

export function buildSessionScreenNoticeState(
  input: Pick<BuildSessionScreenViewModelInput, "error" | "controller">,
) {
  return {
    error: input.error,
    createError: input.controller.createError,
  };
}

export function buildSessionScreenNoticeProps(
  input: Pick<BuildSessionScreenViewModelInput, "error" | "controller">,
) {
  return buildSessionScreenNoticeState(input);
}
