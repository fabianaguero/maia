import { describe, expect, it, vi } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildRelinkMissingTracksNotice,
  buildRepositoryImportSuccessMessage,
  scheduleImportedHighlightReset,
} from "../../src/hooks/appCatalogActionsRuntime";

describe("appCatalogActionsRuntime", () => {
  it("builds repository import success messages with and without rescued logs", () => {
    expect(
      buildRepositoryImportSuccessMessage({
        t: en,
        title: "visits-service",
        rescuedLogCount: 0,
      }),
    ).toBe("visits-service connected.");

    expect(
      buildRepositoryImportSuccessMessage({
        t: en,
        title: "visits-service",
        rescuedLogCount: 3,
      }),
    ).toContain("3");
  });

  it("builds missing-track relink notices and clears imported highlight", () => {
    expect(
      buildRelinkMissingTracksNotice({
        t: en,
        result: {
          relinkedTracks: [{ id: "track-1" } as never],
          unresolvedTrackIds: ["track-2", "track-3"],
        },
      }),
    ).toEqual({
      tone: "success",
      title: en.appShell.missingTracksRelinkedTitle,
      body: "1 resolved, 2 still missing.",
    });

    expect(
      buildRelinkMissingTracksNotice({
        t: en,
        result: {
          relinkedTracks: [],
          unresolvedTrackIds: [],
        },
      }),
    ).toEqual({
      tone: "info",
      title: en.appShell.noMatchesFoundTitle,
      body: en.appShell.noMatchesFoundBody,
    });

    const setNewlyImportedId = vi.fn();
    const setTimeoutFn = vi.fn((handler: () => void) => {
      handler();
      return 1 as never;
    });

    scheduleImportedHighlightReset({
      id: "track-1",
      setNewlyImportedId,
      setTimeoutFn,
      clearDelayMs: 10,
    });

    expect(setNewlyImportedId).toHaveBeenNthCalledWith(1, "track-1");
    expect(setNewlyImportedId).toHaveBeenNthCalledWith(2, null);
  });
});
