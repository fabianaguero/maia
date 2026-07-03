import { useEffectEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";

import type { LibraryTrack } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import { shouldEnsureBackgroundAudio } from "./liveLogMonitorBackgroundDeckControlRuntime";
import {
  applyBackgroundDeckStartControllerResult,
  stopBackgroundDeckState,
} from "./liveLogMonitorBackgroundDeckActionsRuntime";
import {
  scheduleBackgroundDeckTransitionController,
  startBackgroundDeckController,
} from "./liveLogMonitorBackgroundDeckControllerRuntime";
import {
  buildScheduleBackgroundTransitionControllerInput,
  buildStartBackgroundDeckControllerInput,
  loadBackgroundDeckBuffer,
} from "./liveLogMonitorBackgroundDeckHookRuntime";
import type {
  UseLiveLogMonitorBackgroundDeckControlInput,
  UseLiveLogMonitorBackgroundDeckControlResult,
} from "./useLiveLogMonitorBackgroundDeckControlTypes";

export function useLiveLogMonitorBackgroundDeckEventHandlers(input: {
  hookInput: UseLiveLogMonitorBackgroundDeckControlInput;
  clearBackgroundTransition: () => void;
}): Omit<UseLiveLogMonitorBackgroundDeckControlResult, "clearBackgroundTransition"> {
  const stopBackgroundDeck = useEffectEvent((fadeOutSeconds = 0.18) => {
    input.clearBackgroundTransition();
    stopBackgroundDeckState({
      context: input.hookInput.audioContextRef.current,
      deck: input.hookInput.backgroundDeckRef.current,
      backgroundDeckRef: input.hookInput.backgroundDeckRef,
      setBackgroundNowPlayingId: input.hookInput.setBackgroundNowPlayingId,
      setBackgroundTransitionPlan: input.hookInput.setBackgroundTransitionPlan,
      fadeOutSeconds,
    });
  });

  const loadBackgroundBuffer = useEffectEvent(
    async (context: AudioContext, track: LibraryTrack) => {
      return loadBackgroundDeckBuffer({
        context,
        track,
        isTauriRuntime: isTauri(),
        cache: input.hookInput.backgroundBufferCacheRef.current,
      });
    },
  );

  const startBackgroundDeck = useEffectEvent(
    async (
      context: AudioContext,
      trackIndex: number,
      transitionPlan?: PlaylistTransitionPlan | null,
    ) => {
      const result = await startBackgroundDeckController(
        buildStartBackgroundDeckControllerInput({
          hookInput: input.hookInput,
          context,
          trackIndex,
          transitionPlan,
          loadBackgroundBuffer,
        }),
      );

      applyBackgroundDeckStartControllerResult({
        result,
        backgroundDeckRef: input.hookInput.backgroundDeckRef,
        setBackgroundNowPlayingId: input.hookInput.setBackgroundNowPlayingId,
        setBackgroundTransitionPlan: input.hookInput.setBackgroundTransitionPlan,
        setBackgroundPlayheadSecond: input.hookInput.setBackgroundPlayheadSecond,
        setRecentWarnings: input.hookInput.setRecentWarnings,
        maxRecentWarnings: input.hookInput.maxRecentWarnings,
      });
    },
  );

  const scheduleBackgroundTransition = useEffectEvent(
    (context: AudioContext, deck: BackgroundDeckState) => {
      input.clearBackgroundTransition();
      input.hookInput.backgroundTransitionTimerRef.current =
        scheduleBackgroundDeckTransitionController(
          buildScheduleBackgroundTransitionControllerInput({
            hookInput: input.hookInput,
            currentDeck: deck,
            startBackgroundDeck,
            context,
          }),
        );
    },
  );

  const ensureBackgroundAudio = useEffectEvent(async (context: AudioContext) => {
    if (
      !shouldEnsureBackgroundAudio(
        input.hookInput.backgroundDeckRef.current,
        input.hookInput.playableBaseTracks.length,
      )
    ) {
      return;
    }
    await startBackgroundDeck(context, 0);
  });

  return {
    stopBackgroundDeck,
    scheduleBackgroundTransition,
    startBackgroundDeck,
    ensureBackgroundAudio,
  };
}
