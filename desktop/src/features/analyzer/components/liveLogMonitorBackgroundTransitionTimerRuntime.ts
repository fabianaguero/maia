import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";

export interface BackgroundTransitionScheduleResult {
  action: "clear" | "schedule";
  trackIndex?: number;
  transitionPlan?: PlaylistTransitionPlan | null;
  delayMs?: number;
}

export function applyBackgroundTransitionSchedule(input: {
  schedulePlan: BackgroundTransitionScheduleResult;
  setBackgroundTransitionPlan: (value: PlaylistTransitionPlan | null) => void;
  scheduleTimeout: (handler: () => void, delayMs: number) => number;
  onStartTransition: (trackIndex: number, transitionPlan: PlaylistTransitionPlan | null) => void;
}): number | null {
  if (input.schedulePlan.action !== "schedule") {
    input.setBackgroundTransitionPlan(null);
    return null;
  }

  input.setBackgroundTransitionPlan(input.schedulePlan.transitionPlan ?? null);
  return input.scheduleTimeout(() => {
    input.onStartTransition(
      input.schedulePlan.trackIndex ?? 0,
      input.schedulePlan.transitionPlan ?? null,
    );
  }, input.schedulePlan.delayMs ?? 0);
}
