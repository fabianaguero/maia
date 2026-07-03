import {
  buildAppContentStatusViewModel,
  resolveAppContentRouteState,
  resolveAppMutationState,
} from "../appContentRuntime";
import { useAppContentSessionEffects } from "../hooks/useAppContentSessionEffects";
import type { AppContentDomainState } from "./appContentControllerTypes";
import {
  buildAppContentMutationInput,
  buildAppContentSessionEffectsInput,
  buildAppContentStatusInput,
} from "./appContentControllerRuntime";

export function useAppContentDerivedState(domainState: AppContentDomainState) {
  const {
    userMode,
    shellState: { screen, pillar },
    t,
  } = domainState;

  const { effectivePillar, effectiveScreen } = resolveAppContentRouteState(
    userMode,
    pillar,
    screen,
  );

  useAppContentSessionEffects(buildAppContentSessionEffectsInput(domainState));

  const { analyzerLabel, detailDeckLabel, screenLabel, selectedItemTitle } =
    buildAppContentStatusViewModel(buildAppContentStatusInput(domainState), t);

  const { isMutating, mutateLabel } = resolveAppMutationState(
    buildAppContentMutationInput(domainState),
    t,
  );

  return {
    effectivePillar,
    effectiveScreen,
    analyzerLabel,
    detailDeckLabel,
    screenLabel,
    selectedItemTitle,
    isMutating,
    mutateLabel,
  };
}
