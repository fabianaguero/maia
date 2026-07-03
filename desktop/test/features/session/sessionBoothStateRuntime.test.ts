import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  resolveSessionBoothHeadline,
  resolveSessionBoothState,
  resolveSessionBoothSummary,
} from "../../../src/features/session/sessionBoothStateRuntime";

describe("sessionBoothStateRuntime", () => {
  it("resolves booth state, headline and summary across idle/live/replay", () => {
    expect(
      resolveSessionBoothState({
        playbackActive: false,
        isPlaybackPaused: false,
        liveMonitorActive: false,
        readyToRun: true,
        latestUpdate: null,
        t: en,
      }),
    ).toEqual({ tone: "armed", label: en.session.boothArmed });
    expect(
      resolveSessionBoothHeadline({
        playbackActive: false,
        liveMonitorActive: false,
        activeSession: null,
        monitorSession: null,
        sourceLabel: "customers-service",
        t: en,
      }),
    ).toBe("customers-service");
    expect(
      resolveSessionBoothSummary({
        playbackActive: false,
        liveMonitorActive: false,
        readyToRun: true,
        latestUpdate: null,
        playbackPercent: null,
        t: en,
      }),
    ).toBe(en.session.baseAndSourceArmed);
  });
});
