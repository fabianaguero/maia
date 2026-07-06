import { describe, expect, it, vi } from "vitest";

import {
  buildSessionSavedSessionsListCardProps,
  resolveSessionSavedSessionsListState,
} from "../../../src/features/session/sessionSavedSessionsListRuntime";

describe("sessionSavedSessionsListRuntime", () => {
  it("resolves loading, empty and ready states deterministically", () => {
    expect(resolveSessionSavedSessionsListState({ loading: true, sessionCount: 3 })).toBe(
      "loading",
    );
    expect(resolveSessionSavedSessionsListState({ loading: false, sessionCount: 0 })).toBe("empty");
    expect(resolveSessionSavedSessionsListState({ loading: false, sessionCount: 1 })).toBe("ready");
  });

  it("builds saved session card props from list and playback activity", () => {
    const onSelectSession = vi.fn();
    const onResumeSession = vi.fn();
    const onPlaybackSession = vi.fn(async () => undefined);
    const onDeleteSession = vi.fn();

    const cardPropsList = buildSessionSavedSessionsListCardProps({
      sessions: [{ id: "session-1" }, { id: "session-2" }] as never,
      mutating: true,
      selectedSessionId: "session-2",
      activeSessionId: "session-1",
      activeSessionMode: "playback",
      sessionBookmarksBySessionId: { "session-1": [{ id: 1 }] } as never,
      liveWindowCount: 4,
      liveProcessedLines: 48,
      liveTotalAnomalies: 2,
      onSelectSession,
      onResumeSession,
      onPlaybackSession,
      onDeleteSession,
    });

    expect(cardPropsList).toHaveLength(2);
    expect(cardPropsList[0]).toMatchObject({
      key: "session-1",
      active: true,
      playbackActive: true,
      selected: false,
      mutating: true,
      liveProcessedLines: 48,
    });
    expect(cardPropsList[0]?.bookmarks).toEqual([{ id: 1 }]);
    expect(cardPropsList[1]?.selected).toBe(true);
    expect(cardPropsList[1]?.onSelectSession).toBe(onSelectSession);
  });
});
