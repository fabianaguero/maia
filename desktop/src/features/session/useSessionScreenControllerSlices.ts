import { useMemo } from "react";

import type { AppTranslations } from "../../i18n/types";
import { useReplayFeedbackRecommendation } from "../../hooks/useReplayFeedbackRecommendation";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import { useSessionScreenActions } from "./useSessionScreenActions";
import { useSessionScreenEffects } from "./useSessionScreenEffects";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";
import {
  buildSessionScreenControllerSlicesActionsInput,
  buildSessionScreenControllerSlicesBooth,
  buildSessionScreenControllerSlicesEffectsInput,
  buildSessionScreenControllerSlicesResult,
  resolveSessionScreenControllerSlicesDerivedState,
  resolveSessionScreenControllerSlicesTemplateSelection,
} from "./sessionScreenControllerSlicesRuntime";
import {
  pickSessionScreenControllerSlicesActionLocalState,
  pickSessionScreenControllerSlicesBoothLocalState,
  pickSessionScreenControllerSlicesDerivedLocalState,
  pickSessionScreenControllerSlicesEffectsLocalState,
  resolveSessionScreenControllerTemplateMeta,
} from "./sessionScreenControllerSlicesStateRuntime";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;
type MonitorSnapshot = ReturnType<typeof buildSessionScreenControllerMonitorSnapshot>;

interface UseSessionScreenControllerSlicesInput {
  t: AppTranslations;
  input: SessionScreenControllerInput;
  monitorSnapshot: MonitorSnapshot;
  localState: SessionScreenLocalState;
}

export function useSessionScreenControllerSlices({
  t,
  input,
  monitorSnapshot,
  localState,
}: UseSessionScreenControllerSlicesInput) {
  const actionLocalState = pickSessionScreenControllerSlicesActionLocalState(localState);
  const derivedLocalState = pickSessionScreenControllerSlicesDerivedLocalState(localState);
  const effectsLocalState = pickSessionScreenControllerSlicesEffectsLocalState(localState);
  const boothLocalState = pickSessionScreenControllerSlicesBoothLocalState(localState);

  const actions = useSessionScreenActions(
    buildSessionScreenControllerSlicesActionsInput({
      t,
      controllerInput: input,
      localState: actionLocalState,
    }),
  );

  const { selectedTemplate, selectedTemplatePresentation } =
    resolveSessionScreenControllerSlicesTemplateSelection({
      selectedTemplateId: localState.selectedTemplateId,
      t,
    });
  const { selectedTemplateGenre, selectedTemplateLabel } =
    resolveSessionScreenControllerTemplateMeta({
      selectedTemplate,
      selectedTemplatePresentation,
    });

  const derivedState = useMemo(
    () =>
      resolveSessionScreenControllerSlicesDerivedState({
        t,
        controllerInput: input,
        monitorSnapshot,
        localState: derivedLocalState,
        selectedTemplateGenre,
        selectedTemplateLabel,
      }),
    [
      input,
      monitorSnapshot,
      derivedLocalState,
      t,
      selectedTemplateGenre,
      selectedTemplateLabel,
    ],
  );

  useSessionScreenEffects(
    buildSessionScreenControllerSlicesEffectsInput({
      monitorSnapshot,
      localState: effectsLocalState,
      derivedState: {
        selectedSessionIdForEvents: derivedState.selectedSessionIdForEvents,
        activeBedUrl: derivedState.activeBedUrl,
      },
    }),
  );

  const selectedSessionReplayFeedbackRecommendation = useReplayFeedbackRecommendation(
    derivedState.selectedSessionBookmarks,
  );

  const booth = buildSessionScreenControllerSlicesBooth({
    t,
    monitorSnapshot,
    localState: boothLocalState,
    derivedState,
  });

  return buildSessionScreenControllerSlicesResult({
    actions,
    selectedTemplate,
    selectedTemplatePresentation,
    derivedState,
    selectedSessionReplayFeedbackRecommendation,
    booth,
  });
}
