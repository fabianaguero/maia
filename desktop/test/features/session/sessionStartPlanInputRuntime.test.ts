import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildDirectSessionStartInput,
  buildLiveSessionStartInput,
  buildResumeSessionStartInput,
  buildSessionStartDraft,
} from "../../../src/features/session/sessionStartPlanInputRuntime";

describe("sessionStartPlanInputRuntime", () => {
  it("builds session start draft for track and playlist modes", () => {
    expect(
      buildSessionStartDraft({
        baseMode: "track",
        sourceId: "repo-1",
        selectedTrackId: "track-1",
        selectedPlaylistId: "playlist-1",
      }),
    ).toEqual({
      sourceId: "repo-1",
      trackId: "track-1",
      playlistId: undefined,
    });
  });

  it("builds live and direct session start inputs", () => {
    expect(
      buildLiveSessionStartInput({
        sessionId: "session_1",
        source: {
          sourcePath: "/logs/production.log",
          title: "production.log",
        } as never,
        sessionLabel: "",
      }),
    ).toEqual({
      sessionId: "session_1",
      adapterKind: "file",
      source: "/logs/production.log",
      label: "production.log",
      startFromBeginning: true,
    });

    expect(
      buildDirectSessionStartInput({
        sessionId: "direct_1",
        source: "/var/log/custom.log",
        copy: en,
      }),
    ).toEqual({
      sessionId: "direct_1",
      adapterKind: "file",
      source: "/var/log/custom.log",
      label: "custom.log",
      startFromBeginning: true,
    });
  });

  it("builds resume session input with best label fallback", () => {
    expect(
      buildResumeSessionStartInput({
        session: {
          id: "session-1",
          label: "",
          sourceTitle: "session title",
        } as never,
        source: { title: "repo title" } as never,
        sourcePath: "/logs/production.log",
        copy: en,
      }),
    ).toEqual({
      sessionId: "session-1",
      adapterKind: "file",
      source: "/logs/production.log",
      label: "repo title",
    });
  });
});
