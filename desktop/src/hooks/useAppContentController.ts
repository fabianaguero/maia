import { buildAppContentControllerValue } from "./appContentControllerRuntime";
import { buildAppContentControllerActionBundles } from "./appContentControllerBundleRuntime";
import { buildAppContentControllerDerivedState } from "./appContentControllerDerivedRuntime";
import { useAppContentActionBundles } from "./useAppContentActionBundles";
import { useAppContentDerivedState } from "./useAppContentDerivedState";
import { useAppContentDomainState } from "./useAppContentDomainState";

export function useAppContentController() {
  const domainState = useAppContentDomainState();
  const actionBundles = buildAppContentControllerActionBundles(
    useAppContentActionBundles(domainState),
  );
  const derivedState = buildAppContentControllerDerivedState(
    useAppContentDerivedState(domainState),
  );

  const {
    effectivePillar,
    effectiveScreen,
    analyzerLabel,
    detailDeckLabel,
    screenLabel,
    selectedItemTitle,
    isMutating,
    mutateLabel,
  } = derivedState;

  return buildAppContentControllerValue({
    domainState,
    actionBundles,
    effectivePillar,
    effectiveScreen,
    analyzerLabel,
    detailDeckLabel,
    screenLabel,
    selectedItemTitle,
    isMutating,
    mutateLabel,
  });
}
