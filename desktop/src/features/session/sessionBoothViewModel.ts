export type {
  BoothStatItem,
  BuildSessionBoothViewModelInput,
  SessionBoothViewModel,
} from "./sessionBoothViewModelTypes";

import {
  buildSessionBoothViewModelCollections,
  buildSessionBoothViewModelState,
} from "./sessionBoothViewModelRuntime";
import type {
  BuildSessionBoothViewModelInput,
  SessionBoothViewModel,
} from "./sessionBoothViewModelTypes";

export function buildSessionBoothViewModel(
  input: BuildSessionBoothViewModelInput,
): SessionBoothViewModel {
  return {
    ...buildSessionBoothViewModelState(input),
    ...buildSessionBoothViewModelCollections(input.latestUpdate),
  };
}
