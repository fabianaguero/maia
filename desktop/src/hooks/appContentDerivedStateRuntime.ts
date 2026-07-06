import {
  buildAppContentStatusViewModel,
  resolveAppContentRouteState,
  resolveAppMutationState,
} from "../appContentRuntime";
import type { AppContentDomainState } from "./appContentControllerTypes";
import {
  buildAppContentMutationInput,
  buildAppContentSessionEffectsInput,
  buildAppContentStatusInput,
} from "./appContentControllerRuntime";

export function buildAppContentDerivedStateValue(domainState: AppContentDomainState) {
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
  const { analyzerLabel, detailDeckLabel, screenLabel, selectedItemTitle } =
    buildAppContentStatusViewModel(buildAppContentStatusInput(domainState), t);
  const { isMutating, mutateLabel } = resolveAppMutationState(
    buildAppContentMutationInput(domainState),
    t,
  );

  return {
    sessionEffectsInput: buildAppContentSessionEffectsInput(domainState),
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
