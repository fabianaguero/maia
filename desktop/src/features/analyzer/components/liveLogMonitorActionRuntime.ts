import type { SessionBookmark } from "../../../api/sessions";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";

export interface LiveMonitorStopResetState {
  selectedExplanationId: string | null;
  backgroundPlayheadSecond: number;
  liveMutationState: LiveMutationState;
  forcedLiveMutationState: "auto";
  beatClockBpm: number | null;
  beatLooperActive: boolean;
}

export interface LiveMonitorPrefsSelection {
  selectedStyleProfileId: string | null;
  selectedMutationProfileId: string | null;
}

export function buildLiveMonitorStopResetState(): LiveMonitorStopResetState {
  return {
    selectedExplanationId: null,
    backgroundPlayheadSecond: 0,
    liveMutationState: "normal",
    forcedLiveMutationState: "auto",
    beatClockBpm: null,
    beatLooperActive: false,
  };
}

export function resolveLiveMonitorBounceFilename(input: {
  repositoryTitle: string;
  windowCount: number;
  bounceWindowSeconds: number;
}): string {
  const durationSeconds = (input.windowCount * input.bounceWindowSeconds).toFixed(0);
  return `maia-bounce-${input.repositoryTitle.replace(/[^a-z0-9]/gi, "_")}-${durationSeconds}s.wav`;
}

export function resolveBookmarkSuggestionSelection(
  bookmark: Pick<SessionBookmark, "suggestedStyleProfileId" | "suggestedMutationProfileId">,
): LiveMonitorPrefsSelection {
  return {
    selectedStyleProfileId: bookmark.suggestedStyleProfileId ?? null,
    selectedMutationProfileId: bookmark.suggestedMutationProfileId ?? null,
  };
}

export function resolveReplayFeedbackSelection(input: {
  suggestedStyleProfileId: string;
  suggestedMutationProfileId: string;
}): LiveMonitorPrefsSelection {
  return {
    selectedStyleProfileId: input.suggestedStyleProfileId,
    selectedMutationProfileId: input.suggestedMutationProfileId,
  };
}
