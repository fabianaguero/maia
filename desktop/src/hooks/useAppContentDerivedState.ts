import { useAppContentSessionEffects } from "../hooks/useAppContentSessionEffects";
import type { AppContentDomainState } from "./appContentControllerTypes";
import { buildAppContentDerivedStateValue } from "./appContentDerivedStateRuntime";

export function useAppContentDerivedState(domainState: AppContentDomainState) {
  const derivedState = buildAppContentDerivedStateValue(domainState);

  useAppContentSessionEffects(derivedState.sessionEffectsInput);

  return {
    effectivePillar: derivedState.effectivePillar,
    effectiveScreen: derivedState.effectiveScreen,
    analyzerLabel: derivedState.analyzerLabel,
    detailDeckLabel: derivedState.detailDeckLabel,
    screenLabel: derivedState.screenLabel,
    selectedItemTitle: derivedState.selectedItemTitle,
    isMutating: derivedState.isMutating,
    mutateLabel: derivedState.mutateLabel,
  };
}
