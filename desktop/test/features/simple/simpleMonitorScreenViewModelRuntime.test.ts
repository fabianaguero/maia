import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  resolveSimpleMonitorDeckRemainingSeconds,
  resolveSimpleMonitorSourceBinding,
  resolveSimpleMonitorTrackLabel,
} from "../../../src/features/simple/simpleMonitorScreenViewModelRuntime";

describe("simpleMonitorScreenViewModelRuntime", () => {
  it("resolves source binding from session, launch source, and fallback copy", () => {
    expect(
      resolveSimpleMonitorSourceBinding({
        session: {
          repoTitle: "visits-service",
          sourcePath: "/logs/visits-service.log",
        } as never,
        launchingSource: {
          title: "ignored",
          sourcePath: "/ignored",
        } as never,
        t: en,
      }),
    ).toEqual({
      monitorSourceTitle: "visits-service",
      monitorSourcePath: "/logs/visits-service.log",
    });

    expect(
      resolveSimpleMonitorSourceBinding({
        session: null,
        launchingSource: null,
        t: en,
      }),
    ).toEqual({
      monitorSourceTitle: en.simpleMode.setup.bootingMonitor,
      monitorSourcePath: en.simpleMode.setup.awaitingSourceBinding,
    });
  });

  it("resolves track label and remaining seconds deterministically", () => {
    expect(
      resolveSimpleMonitorTrackLabel({
        trackName: undefined,
        session: { trackName: "Around The World" } as never,
        selectedSoundId: "track-1",
        tracks: [
          {
            id: "track-1",
            tags: { title: "ignored", artist: null } as never,
            sourcePath: "/music/track-1.mp3",
          } as never,
        ],
        t: en,
      }),
    ).toBe("Around The World");

    expect(
      resolveSimpleMonitorTrackLabel({
        trackName: undefined,
        session: null,
        selectedSoundId: "",
        tracks: [],
        t: en,
      }),
    ).toBe(en.simpleMode.monitor.noTrackSelected);

    expect(
      resolveSimpleMonitorDeckRemainingSeconds({
        deckDurationSeconds: 180,
        trackElapsedSeconds: 42,
      }),
    ).toBe(138);
    expect(
      resolveSimpleMonitorDeckRemainingSeconds({
        deckDurationSeconds: null,
        trackElapsedSeconds: 42,
      }),
    ).toBeNull();
  });
});
