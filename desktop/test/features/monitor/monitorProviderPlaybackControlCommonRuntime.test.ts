import { describe, expect, it, vi } from "vitest";

import {
  buildGuideTrackSynchronizedReplayDispatch,
  canControlMonitorPlayback,
  hasReplayEvents,
} from "../../../src/features/monitor/monitorProviderPlaybackControlCommonRuntime";

describe("monitorProviderPlaybackControlCommonRuntime", () => {
  it("detects replay availability and combined playback control eligibility", () => {
    expect(hasReplayEvents({ current: [] })).toBe(false);
    expect(hasReplayEvents({ current: [{}] })).toBe(true);
    expect(
      canControlMonitorPlayback({ isPlayback: false, replayEventsRef: { current: [{}] } }),
    ).toBe(false);
    expect(canControlMonitorPlayback({ isPlayback: true, replayEventsRef: { current: [] } })).toBe(
      false,
    );
    expect(
      canControlMonitorPlayback({ isPlayback: true, replayEventsRef: { current: [{}] } }),
    ).toBe(true);
  });

  it("wraps replay dispatches with guide-track sync enabled", () => {
    const dispatchReplayEventAtIndex = vi.fn(() => true);

    const dispatch = buildGuideTrackSynchronizedReplayDispatch(dispatchReplayEventAtIndex);
    expect(dispatch(4)).toBe(true);
    expect(dispatchReplayEventAtIndex).toHaveBeenCalledWith(4, { syncGuideTrack: true });
  });
});
