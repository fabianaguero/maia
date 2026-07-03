import { describe, expect, it, vi } from "vitest";

import {
  applyCatalogImportSuccess,
  buildBaseAssetImportNotice,
  buildCatalogImportNavigation,
  buildCompositionImportNotice,
  buildRepositoryImportNotice,
  buildTrackImportNotice,
  runCatalogImportAction,
} from "../../src/hooks/appCatalogImportActionsRuntime";
import { en } from "../../src/i18n/en";

describe("appCatalogImportActionsRuntime", () => {
  it("builds notices and import navigation", () => {
    expect(buildCatalogImportNavigation("track")).toEqual({
      analysisMode: "track",
      screen: "inspect",
    });
    expect(buildTrackImportNotice(en, "Track A")).toEqual({
      tone: "success",
      title: en.appShell.trackImportedTitle,
      body: expect.stringContaining("Track A"),
    });
    expect(buildBaseAssetImportNotice(en, "Base A")).toEqual({
      tone: "success",
      title: en.appShell.assetImportedTitle,
      body: expect.stringContaining("Base A"),
    });
    expect(buildCompositionImportNotice(en, "Composition A")).toEqual({
      tone: "success",
      title: en.appShell.compositionReadyTitle,
      body: expect.stringContaining("Composition A"),
    });
    expect(
      buildRepositoryImportNotice({
        t: en,
        title: "Repo A",
        rescuedLogCount: 2,
      }),
    ).toEqual({
      tone: "success",
      title: en.appShell.repositoryConnectedTitle,
      body: expect.stringContaining("Repo A"),
    });
  });

  it("runs import actions and applies success state", async () => {
    const notify = vi.fn();
    const setNewlyImportedId = vi.fn();
    const setAnalysisMode = vi.fn();
    const setScreen = vi.fn();

    await expect(
      runCatalogImportAction({
        task: async () => ({ id: "track-1", tags: { title: "Track A" } }),
        onSuccess: (result) => {
          applyCatalogImportSuccess({
            id: result.id,
            notice: buildTrackImportNotice(en, result.tags.title),
            notify,
            setNewlyImportedId,
            navigation: buildCatalogImportNavigation("track"),
            setAnalysisMode,
            setScreen,
          });
        },
        onError: (error) => ({
          tone: "error",
          title: "fail",
          body: String(error),
        }),
        notify,
      }),
    ).resolves.toBe(true);

    await expect(
      runCatalogImportAction({
        task: async () => {
          throw new Error("broken");
        },
        onSuccess: () => undefined,
        onError: (error) => ({
          tone: "error",
          title: "fail",
          body: String(error),
        }),
        notify,
      }),
    ).resolves.toBe(false);

    expect(notify).toHaveBeenCalledWith(
      "success",
      en.appShell.trackImportedTitle,
      expect.stringContaining("Track A"),
    );
    expect(setNewlyImportedId).toHaveBeenCalledWith("track-1");
    expect(setAnalysisMode).toHaveBeenCalledWith("track");
    expect(setScreen).toHaveBeenCalledWith("inspect");
    expect(notify).toHaveBeenCalledWith("error", "fail", expect.stringContaining("broken"));
  });
});
