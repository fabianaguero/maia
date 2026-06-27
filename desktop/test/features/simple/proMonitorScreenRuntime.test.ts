import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildProMonitorMockData } from "../../../src/features/simple/proMonitorMockData";
import {
  buildProMonitorScreenViewModel,
  createCustomProMonitorBookmark,
  resolveProMonitorBookmarkTag,
  resolveProMonitorLevelBadgeClass,
} from "../../../src/features/simple/proMonitorScreenRuntime";

describe("proMonitorScreenRuntime", () => {
  it("resolves bookmark tags and badge classes deterministically", () => {
    expect(
      resolveProMonitorBookmarkTag(en, {
        id: "1",
        timestamp: "09:14:27",
        tagKind: "anomaly",
      }),
    ).toBe(en.simpleMode.proMonitor.tagAnomaly);
    expect(resolveProMonitorLevelBadgeClass("warn")).toBe("badge-warn");
    expect(resolveProMonitorLevelBadgeClass("error")).toBe("badge-error");
    expect(resolveProMonitorLevelBadgeClass("info")).toBe("badge-info");
  });

  it("creates a stable custom bookmark and decorates the view model", () => {
    const mockData = buildProMonitorMockData(en);
    const customBookmark = createCustomProMonitorBookmark(42);
    const viewModel = buildProMonitorScreenViewModel({
      t: en,
      mockData,
      bookmarks: [...mockData.bookmarks, customBookmark],
    });

    expect(customBookmark).toEqual({
      id: "42",
      timestamp: "09:15:00",
      tagKind: "custom",
    });
    expect(viewModel.mockData.sessionTitle).toBe(en.simpleMode.proMonitor.demoSessionTitle);
    expect(viewModel.mockData.trackTitle).toBe(en.simpleMode.proMonitor.demoTrackTitle);
    expect(viewModel.logLines[0]).toMatchObject({
      levelBadgeClassName: "badge-info",
      levelLabel: "INFO",
    });
    expect(viewModel.bookmarks.at(-1)).toMatchObject({
      id: "42",
      tagLabel: en.simpleMode.proMonitor.tagCustom,
    });
  });
});
