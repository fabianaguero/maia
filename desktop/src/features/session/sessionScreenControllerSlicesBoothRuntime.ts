import type { MutableRefObject } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import { buildSessionBoothViewModel } from "./sessionBoothViewModel";
import {
  buildSessionScreenControllerBoothHookInput,
  buildSessionScreenBoothViewModelInput,
  buildSessionScreenEffectsHookInput,
} from "./sessionScreenControllerHookRuntime";
import { buildSessionBoothInput } from "./sessionScreenControllerRuntime";
import type { SessionControllerDerivedState } from "./sessionScreenRuntime";
import type { useSessionScreenLocalState } from "./useSessionScreenLocalState";
import type { buildSessionScreenControllerMonitorSnapshot } from "./sessionScreenControllerHookRuntime";

type SessionScreenLocalState = ReturnType<typeof useSessionScreenLocalState>;
type MonitorSnapshot = ReturnType<typeof buildSessionScreenControllerMonitorSnapshot>;

export function buildSessionScreenControllerSlicesEffectsInput(input: {
  monitorSnapshot: Pick<MonitorSnapshot, "monitorSessionId" | "subscribeToMonitor">;
  localState: Pick<
    SessionScreenLocalState,
    | "setLatestUpdate"
    | "setSelectedSessionEvents"
    | "boothBedAudioRef"
  >;
  derivedState: Pick<SessionControllerDerivedState, "selectedSessionIdForEvents" | "activeBedUrl">;
}) {
  return buildSessionScreenEffectsHookInput({
    monitorSessionId: input.monitorSnapshot.monitorSessionId,
    subscribeToMonitor: input.monitorSnapshot.subscribeToMonitor,
    setLatestUpdate: input.localState.setLatestUpdate,
    selectedSessionIdForEvents: input.derivedState.selectedSessionIdForEvents,
    setSelectedSessionEvents: input.localState.setSelectedSessionEvents,
    activeBedUrl: input.derivedState.activeBedUrl,
    boothBedAudioRef: input.localState.boothBedAudioRef as MutableRefObject<HTMLAudioElement | null>,
  });
}

export function buildSessionScreenControllerSlicesBooth(input: {
  t: AppTranslations;
  monitorSnapshot: Pick<
    MonitorSnapshot,
    | "monitorSession"
    | "monitorMetrics"
    | "isPlaybackPaused"
    | "playbackEventIndex"
    | "playbackEventCount"
  >;
  localState: Pick<SessionScreenLocalState, "mode" | "latestUpdate">;
  derivedState: SessionControllerDerivedState;
}) {
  return buildSessionBoothViewModel(
    buildSessionBoothInput(
      buildSessionScreenBoothViewModelInput(
        buildSessionScreenControllerBoothHookInput({
          t: input.t,
          mode: input.localState.mode,
          latestUpdate: input.localState.latestUpdate as LiveLogStreamUpdate | null,
          derivedState: input.derivedState,
          monitorSnapshot: input.monitorSnapshot,
        }),
      ),
    ),
  );
}

export function buildSessionScreenControllerSlicesResult<
  TActions,
  TSelectedTemplate,
  TSelectedTemplatePresentation,
  TRecommendation,
  TBooth,
>(input: {
  actions: TActions;
  selectedTemplate: TSelectedTemplate;
  selectedTemplatePresentation: TSelectedTemplatePresentation;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: TRecommendation;
  booth: TBooth;
}): {
  actions: TActions;
  selectedTemplate: TSelectedTemplate;
  selectedTemplatePresentation: TSelectedTemplatePresentation;
  derivedState: SessionControllerDerivedState;
  selectedSessionReplayFeedbackRecommendation: TRecommendation;
  booth: TBooth;
} {
  return input;
}
