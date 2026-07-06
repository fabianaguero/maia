import { describe, expect, it } from "vitest";

import {
  resolveSessionBoothActionBarMode,
  resolveSessionBoothDirectLaunchDisabled,
  resolveSessionBoothShowReplaySelected,
  resolveSessionBoothShowResumeSelected,
  resolveSessionBoothStartDisabled,
} from "../../../src/features/session/sessionBoothActionBarRuntime";

describe("sessionBoothActionBarRuntime", () => {
  it("resolves action bar mode deterministically", () => {
    expect(
      resolveSessionBoothActionBarMode({
        playbackActive: true,
        liveMonitorActive: true,
      }),
    ).toBe("playback");
    expect(
      resolveSessionBoothActionBarMode({
        playbackActive: false,
        liveMonitorActive: true,
      }),
    ).toBe("live");
    expect(
      resolveSessionBoothActionBarMode({
        playbackActive: false,
        liveMonitorActive: false,
      }),
    ).toBe("idle");
  });

  it("resolves disabled and visibility states for idle controls", () => {
    expect(
      resolveSessionBoothDirectLaunchDisabled({
        directPath: "   ",
        isDirectLoading: false,
      }),
    ).toBe(true);
    expect(
      resolveSessionBoothDirectLaunchDisabled({
        directPath: "/logs/service.log",
        isDirectLoading: true,
      }),
    ).toBe(true);
    expect(
      resolveSessionBoothShowResumeSelected({
        id: "session-1",
        status: "paused",
      } as never),
    ).toBe(true);
    expect(
      resolveSessionBoothShowReplaySelected({
        id: "session-1",
        totalPolls: 3,
      } as never),
    ).toBe(true);
    expect(
      resolveSessionBoothStartDisabled({
        creating: false,
        mutating: false,
        readyToRun: true,
      }),
    ).toBe(false);
  });
});
