import type { BuildSessionScreenViewModelInput } from "./sessionScreenViewModelTypes";

export function buildSessionScreenNoticeProps(
  input: Pick<BuildSessionScreenViewModelInput, "error" | "controller">,
) {
  return {
    error: input.error,
    createError: input.controller.createError,
  };
}
