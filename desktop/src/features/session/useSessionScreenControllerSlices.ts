import { useMemo } from "react";

import type { AppTranslations } from "../../i18n/types";
import { useReplayFeedbackRecommendation } from "../../hooks/useReplayFeedbackRecommendation";
import { buildSessionBoothViewModel } from "./sessionBoothViewModel";
import {
  buildSessionScreenControllerActionsHookInput,
  buildSessionScreenControllerBoothHookInput,
  buildSessionScreenControllerDerivedHookInput,
  buildSessionScreenBoothViewModelInput,
  buildSessionScreenEffectsHookInput,
  type buildSessionScreenControllerMonitorSnapshot,
} from "./sessionScreenControllerHookRuntime";
import {
  buildSessionBoothInput,
  buildSessionControllerDerivedInput,
  buildSessionScreenActionsInput,
  resolveSessionScreenTemplateSelection,
} from "./sessionScreenControllerRuntime";
import { resolveSessionControllerDerivedState } from "./sessionScreenRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import { useSessionScreenActions } from "./useSessionScreenActions";
import { useSessionScreenEffects } from "./useSessionScreenEffects";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";

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
    buildSessionScreenActionsInput(
      buildSessionScreenControllerActionsHookInput({
        t,
        controllerInput: input,
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
      }),
    ),
  );

  const { selectedTemplate, selectedTemplatePresentation } = resolveSessionScreenTemplateSelection({
    selectedTemplateId,
    t,
  });

  const derivedState = useMemo(
    () =>
      resolveSessionControllerDerivedState(
        buildSessionControllerDerivedInput(
          buildSessionScreenControllerDerivedHookInput({
            controllerInput: input,
            activePlaybackProgress: input.activePlaybackProgress,
            activeSessionId: input.activeSessionId,
            activeSessionMode: input.activeSessionMode,
            baseMode,
            mode,
            monitorHasSession: monitorSnapshot.monitorHasSession,
            selectedPlaylistId,
            selectedSessionEvents,
            selectedSourceId,
            selectedTrackId,
            sessionPlaceholderFallback: t.session.sessionPlaceholder,
            templateGenre: selectedTemplatePresentation?.genre ?? selectedTemplate?.genre ?? null,
            templateLabel: selectedTemplatePresentation?.label ?? selectedTemplate?.label ?? null,
          }),
      ),
    ),
    [
      baseMode,
      input,
      mode,
      monitorSnapshot.monitorHasSession,
      selectedPlaylistId,
      selectedSessionEvents,
      selectedSourceId,
      selectedTrackId,
      selectedTemplate?.genre,
      selectedTemplate?.label,
      selectedTemplatePresentation?.genre,
      selectedTemplatePresentation?.label,
      t.session.sessionPlaceholder,
    ],
  );

  useSessionScreenEffects(
    buildSessionScreenEffectsHookInput({
      monitorSessionId: monitorSnapshot.monitorSessionId,
      subscribeToMonitor: monitorSnapshot.subscribeToMonitor,
      setLatestUpdate,
      selectedSessionIdForEvents: derivedState.selectedSessionIdForEvents,
      setSelectedSessionEvents,
      activeBedUrl: derivedState.activeBedUrl,
      boothBedAudioRef,
    }),
  );

  const selectedSessionReplayFeedbackRecommendation = useReplayFeedbackRecommendation(
    derivedState.selectedSessionBookmarks,
  );

  const booth = buildSessionBoothViewModel(
    buildSessionBoothInput(
      buildSessionScreenBoothViewModelInput(
        buildSessionScreenControllerBoothHookInput({
          t,
          mode,
          latestUpdate,
          derivedState,
          monitorSnapshot,
        }),
      ),
    ),
  );

  return {
    actions,
    selectedTemplate,
    selectedTemplatePresentation,
    derivedState,
    selectedSessionReplayFeedbackRecommendation,
    booth,
  };
}
