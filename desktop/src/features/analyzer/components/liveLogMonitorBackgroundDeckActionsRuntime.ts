import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { BackgroundDeckStartControllerResult } from "./liveLogMonitorBackgroundDeckControllerRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import {
  clearBackgroundDeckState,
  fadeOutBackgroundDeck,
  prependBackgroundDeckWarning,
} from "./liveLogMonitorBackgroundDeckControlRuntime";

type SetNullableStringState = Dispatch<SetStateAction<string | null>>;
type SetNullableTransitionPlanState = Dispatch<SetStateAction<PlaylistTransitionPlan | null>>;
type SetNumberState = Dispatch<SetStateAction<number>>;
type SetWarningsState = Dispatch<SetStateAction<string[]>>;

export function clearBackgroundDeckPresentationState(
  setBackgroundNowPlayingId: SetNullableStringState,
  setBackgroundTransitionPlan: SetNullableTransitionPlanState,
): void {
  clearBackgroundDeckState(
    setBackgroundNowPlayingId,
    setBackgroundTransitionPlan as (value: null) => void,
  );
}

export function stopBackgroundDeckState(input: {
  context: AudioContext | null;
  deck: BackgroundDeckState | null;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  setBackgroundNowPlayingId: SetNullableStringState;
  setBackgroundTransitionPlan: SetNullableTransitionPlanState;
  fadeOutSeconds: number;
}): void {
  if (!input.context || !input.deck) {
    input.backgroundDeckRef.current = null;
    clearBackgroundDeckPresentationState(
      input.setBackgroundNowPlayingId,
      input.setBackgroundTransitionPlan,
    );
    return;
  }

  const now = input.context.currentTime;
  fadeOutBackgroundDeck(input.deck, now, Math.max(0, input.fadeOutSeconds - 0.02));
  input.backgroundDeckRef.current = null;
  clearBackgroundDeckPresentationState(
    input.setBackgroundNowPlayingId,
    input.setBackgroundTransitionPlan,
  );
}

export function applyBackgroundDeckStartControllerResult(input: {
  result: BackgroundDeckStartControllerResult;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  setBackgroundNowPlayingId: SetNullableStringState;
  setBackgroundTransitionPlan: SetNullableTransitionPlanState;
  setBackgroundPlayheadSecond: SetNumberState;
  setRecentWarnings: SetWarningsState;
  maxRecentWarnings: number;
}): void {
  if (input.result.action === "started") {
    input.backgroundDeckRef.current = input.result.nextDeck;
    input.setBackgroundNowPlayingId(input.result.nowPlayingId);
    input.setBackgroundTransitionPlan(input.result.activeTransitionPlan);
    input.setBackgroundPlayheadSecond(input.result.playheadSecond);
    return;
  }

  if (input.result.action === "failed") {
    const warningMessage = input.result.warningMessage;
    input.backgroundDeckRef.current = null;
    clearBackgroundDeckPresentationState(
      input.setBackgroundNowPlayingId,
      input.setBackgroundTransitionPlan,
    );
    input.setRecentWarnings((current) =>
      prependBackgroundDeckWarning(warningMessage, current, input.maxRecentWarnings),
    );
  }
}
