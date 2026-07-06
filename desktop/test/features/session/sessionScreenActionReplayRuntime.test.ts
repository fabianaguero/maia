import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  runSessionPlaybackAction,
  runSessionReplayBookmarkAction,
} from "../../../src/features/session/sessionScreenActionReplayRuntime";

const session = {
  id: "session-1",
  label: "Night watch",
  sourcePath: "/logs/production.log",
  totalPolls: 3,
} as never;

describe("sessionScreenActionReplayRuntime", () => {
  it("runs playback and replay bookmark flows", async () => {
    const onPlayback = vi.fn(async () => true);
    const onReplayBookmark = vi.fn(async () => true);
    const onSelectSession = vi.fn();
    const setCreateError = vi.fn();

    await runSessionPlaybackAction({
      session,
      t: en,
      onPlayback,
      onSelectSession,
      setCreateError,
    });
    await runSessionReplayBookmarkAction({
      session,
      replayWindowIndex: 3,
      t: en,
      onReplayBookmark,
      onSelectSession,
      setCreateError,
    });

    expect(onPlayback).toHaveBeenCalledWith(session);
    expect(onReplayBookmark).toHaveBeenCalledWith(session, 3);
    expect(onSelectSession).toHaveBeenCalledWith("session-1");
  });
});
