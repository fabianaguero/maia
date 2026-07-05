import { describe, expect, it, vi } from "vitest";

import {
  applyCatalogImportSuccess,
  buildBaseAssetImportNotice,
  buildCatalogImportActionRunners,
  buildCatalogBaseAssetImportAction,
  buildCatalogCompositionImportAction,
  buildCatalogImportNavigation,
  buildCatalogRepositoryImportAction,
  buildCatalogTrackImportAction,
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

  it("builds import action payloads for track, repo, base asset and composition", async () => {
    const notify = vi.fn();
    const setNewlyImportedId = vi.fn();
    const setAnalysisMode = vi.fn();
    const setScreen = vi.fn();
    const importRepositorySource = vi.fn(async (input: { label?: string }) =>
      input.label === "Repo A"
        ? { id: "repo-1", title: "Repo A" }
        : { id: "repo-log", title: String(input.label ?? "") },
    );

    await expect(
      runCatalogImportAction(
        buildCatalogTrackImportAction({
          library: {
            importLibraryTrack: async () => ({ id: "track-1", tags: { title: "Track A" } }),
          },
          importInput: {
            sourcePath: "/music/track-a.wav",
            label: "Track A",
            musicStyleId: "house",
          },
          t: en,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      runCatalogImportAction(
        buildCatalogRepositoryImportAction({
          repositories: { importRepositorySource },
          importInput: { sourcePath: "/repo-a", label: "Repo A", sourceKind: "file" },
          t: en,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      runCatalogImportAction(
        buildCatalogBaseAssetImportAction({
          baseAssets: {
            importLibraryBaseAsset: async () => ({ id: "base-1", title: "Base A" }),
          },
          importInput: { title: "Base A", category: "drums", sourcePath: "/base-a.wav" },
          t: en,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      runCatalogImportAction(
        buildCatalogCompositionImportAction({
          compositions: {
            importLibraryComposition: async () => ({ title: "Composition A" }),
          },
          importInput: { title: "Composition A", sourcePath: "/comp-a.json" },
          t: en,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    ).resolves.toBe(true);

    expect(importRepositorySource).toHaveBeenCalledWith({
      sourcePath: "/repo-a",
      label: "Repo A",
      sourceKind: "file",
    });
    expect(notify).toHaveBeenCalledWith(
      "success",
      en.appShell.trackImportedTitle,
      expect.stringContaining("Track A"),
    );
    expect(notify).toHaveBeenCalledWith(
      "success",
      en.appShell.repositoryConnectedTitle,
      expect.stringContaining("Repo A"),
    );
    expect(notify).toHaveBeenCalledWith(
      "success",
      en.appShell.assetImportedTitle,
      expect.stringContaining("Base A"),
    );
    expect(notify).toHaveBeenCalledWith(
      "success",
      en.appShell.compositionReadyTitle,
      expect.stringContaining("Composition A"),
    );
  });

  it("builds executable import runners", async () => {
    const notify = vi.fn();
    const setNewlyImportedId = vi.fn();
    const setAnalysisMode = vi.fn();
    const setScreen = vi.fn();
    const runners = buildCatalogImportActionRunners({
      t: en,
      notify,
      setNewlyImportedId,
      setAnalysisMode,
      setScreen,
      library: {
        importLibraryTrack: async () => ({ id: "track-1", tags: { title: "Track A" } }),
      } as never,
      repositories: {
        importRepositorySource: async () => ({ id: "repo-1", title: "Repo A" }),
      } as never,
      baseAssets: {
        importLibraryBaseAsset: async () => ({ id: "base-1", title: "Base A" }),
      } as never,
      compositions: {
        importLibraryComposition: async () => ({ title: "Composition A" }),
      } as never,
    });

    await expect(
      runners.handleImportTrack({
        sourcePath: "/music/track-a.wav",
        label: "Track A",
        musicStyleId: "house",
      } as never),
    ).resolves.toBe(true);
    await expect(
      runners.handleImportRepository({
        sourcePath: "/repo-a",
        label: "Repo A",
        sourceKind: "file",
      }),
    ).resolves.toBe(true);
    await expect(
      runners.handleImportBaseAsset({
        title: "Base A",
        category: "drums",
        sourcePath: "/base-a.wav",
      } as never),
    ).resolves.toBe(true);
    await expect(
      runners.handleImportComposition({
        title: "Composition A",
        sourcePath: "/comp-a.json",
      } as never),
    ).resolves.toBe(true);

    expect(setNewlyImportedId).toHaveBeenCalledWith("track-1");
    expect(setAnalysisMode).toHaveBeenCalled();
    expect(setScreen).toHaveBeenCalledWith("inspect");
  });
});
