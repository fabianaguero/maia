import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";
import {
  buildSessionScreenControllerHookResult,
  buildSessionScreenControllerMonitorSnapshot,
} from "./sessionScreenControllerHookRuntime";
import { buildSessionScreenControllerState } from "./sessionScreenControllerRuntime";
import {
  buildSessionScreenControllerMonitorSnapshotInput,
  buildSessionScreenControllerSlicesInput,
  buildSessionScreenControllerStateInput,
} from "./sessionScreenControllerStateRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import { useSessionScreenLocalState } from "./useSessionScreenLocalState";
import { useSessionScreenControllerSlices } from "./useSessionScreenControllerSlices";

export function useSessionScreenController(input: SessionScreenControllerInput) {
  const t = useT();
  const monitor = useMonitor();
  const monitorSnapshot = buildSessionScreenControllerMonitorSnapshot(
    buildSessionScreenControllerMonitorSnapshotInput(monitor),
  );
  const localState = useSessionScreenLocalState({
    trackCount: input.tracks.length,
  });

  const {
    actions: {
      handleCreateSession,
      handleDirectLaunch,
      handleResumeSession,
      handlePlaybackSession,
      handleReplayBookmark,
    },
    derivedState,
    selectedSessionReplayFeedbackRecommendation,
    booth,
  } = useSessionScreenControllerSlices(
    buildSessionScreenControllerSlicesInput({
      t,
      controllerInput: input,
      monitorSnapshot,
      localState,
    }),
  );

  return buildSessionScreenControllerHookResult(
    buildSessionScreenControllerState(
      buildSessionScreenControllerStateInput({
        t,
        monitor,
        localState,
        derivedState,
        actions: {
          handleCreateSession,
          handleDirectLaunch,
          handleResumeSession,
          handlePlaybackSession,
          handleReplayBookmark,
        },
        selectedSessionReplayFeedbackRecommendation,
        booth,
      }),
    ),
  );
}
