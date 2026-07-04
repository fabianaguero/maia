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
  const {
    mode,
    baseMode,
    selectedSourceId,
    selectedTrackId,
    selectedPlaylistId,
    sessionLabel,
    setSessionLabel,
    setCreateError,
    setCreating,
    latestUpdate,
    setLatestUpdate,
    directPath,
    setDirectPath,
    setIsDirectLoading,
    selectedTemplateId,
    selectedSessionEvents,
    setSelectedSessionEvents,
    boothBedAudioRef,
    setSelectedSourceId,
    setSelectedTrackId,
    setSelectedPlaylistId,
  } = localState;

  const actions = useSessionScreenActions(
    buildSessionScreenControllerSlicesActionsInput({
      t,
      controllerInput: input,
      localState: {
        baseMode,
        mode,
        selectedPlaylistId,
        selectedSourceId,
        selectedTrackId,
        sessionLabel,
        directPath,
        setCreateError,
        setCreating,
        setIsDirectLoading,
        setSessionLabel,
        setSelectedSourceId,
        setSelectedTrackId,
        setSelectedPlaylistId,
        setDirectPath,
      },
    }),
  );

  const { selectedTemplate, selectedTemplatePresentation } =
    resolveSessionScreenControllerSlicesTemplateSelection({
      selectedTemplateId,
      t,
    });

  const selectedTemplateGenre = selectedTemplatePresentation?.genre ?? selectedTemplate?.genre ?? null;
  const selectedTemplateLabel = selectedTemplatePresentation?.label ?? selectedTemplate?.label ?? null;

  const derivedState = useMemo(
    () =>
      resolveSessionScreenControllerSlicesDerivedState({
        t,
        controllerInput: input,
        monitorSnapshot,
        localState: {
          baseMode,
          mode,
          selectedPlaylistId,
          selectedSessionEvents,
          selectedSourceId,
          selectedTrackId,
        },
        selectedTemplateGenre,
        selectedTemplateLabel,
      }),
    [
      input,
      monitorSnapshot,
      baseMode,
      mode,
      selectedPlaylistId,
      selectedSessionEvents,
      selectedSourceId,
      selectedTrackId,
      t,
      selectedTemplateGenre,
      selectedTemplateLabel,
    ],
  );

  useSessionScreenEffects(
    buildSessionScreenControllerSlicesEffectsInput({
      monitorSnapshot,
      localState: {
        setLatestUpdate,
        setSelectedSessionEvents,
        boothBedAudioRef,
      },
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
    localState: {
      mode,
      latestUpdate,
    },
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
