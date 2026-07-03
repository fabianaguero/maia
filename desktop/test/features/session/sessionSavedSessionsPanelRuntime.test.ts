import { describe, expect, it } from "vitest";

import { buildSessionSavedSessionListItems } from "../../../src/features/session/sessionSavedSessionsPanelRuntime";

describe("sessionSavedSessionsPanelRuntime", () => {
  it("builds saved session list items with active/playback flags and bookmarks", () => {
    const items = buildSessionSavedSessionListItems({
      sessions: [
        {
          id: "session-1",
        },
        {
          id: "session-2",
        },
      ] as never,
      selectedSessionId: "session-2",
      activeSessionId: "session-1",
      activeSessionMode: "playback",
      sessionBookmarksBySessionId: {
        "session-1": [{ id: 1 }],
      } as never,
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      active: true,
      playbackActive: true,
      selected: false,
    });
    expect(items[0].bookmarks).toEqual([{ id: 1 }]);
    expect(items[1]).toMatchObject({
      active: false,
      playbackActive: false,
      selected: true,
    });
  });
});
