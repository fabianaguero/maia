import { describe, expect, it } from "vitest";

import {
  buildLiveMonitorStopResetState,
  resolveBookmarkSuggestionSelection,
  resolveLiveMonitorBounceFilename,
  resolveReplayFeedbackSelection,
} from "../../src/features/analyzer/components/liveLogMonitorActionRuntime";

describe("liveLogMonitorActionRuntime", () => {
  it("builds the stop reset state for the live monitor panel", () => {
    expect(buildLiveMonitorStopResetState()).toEqual({
      selectedExplanationId: null,
      backgroundPlayheadSecond: 0,
      liveMutationState: "normal",
      forcedLiveMutationState: "auto",
      beatClockBpm: null,
      beatLooperActive: false,
    });
  });

  it("builds a sanitized bounce filename", () => {
    expect(
      resolveLiveMonitorBounceFilename({
        repositoryTitle: "visits-service.prod",
        windowCount: 4,
        bounceWindowSeconds: 3,
      }),
    ).toBe("maia-bounce-visits_service_prod-12s.wav");
  });

  it("resolves bookmark and replay feedback selection state", () => {
    expect(
      resolveBookmarkSuggestionSelection({
        suggestedStyleProfileId: "style-1",
        suggestedMutationProfileId: null,
      } as any),
    ).toEqual({
      selectedStyleProfileId: "style-1",
      selectedMutationProfileId: null,
    });

    expect(
      resolveReplayFeedbackSelection({
        suggestedStyleProfileId: "style-2",
        suggestedMutationProfileId: "mutation-2",
      }),
    ).toEqual({
      selectedStyleProfileId: "style-2",
      selectedMutationProfileId: "mutation-2",
    });
  });
});
