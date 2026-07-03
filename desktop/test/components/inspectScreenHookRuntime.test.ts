import { describe, expect, it, vi } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildInspectScreenBaseAssetViewInput,
  buildInspectScreenContextBarElementInput,
  buildInspectScreenContextBarInput,
  buildInspectScreenRenderStateInput,
  buildInspectScreenRepositoryViewInput,
  buildInspectScreenTrackViewInput,
  resolveInspectScreenPlaceholderTitle,
} from "../../src/features/inspect/inspectScreenHookRuntime";

describe("inspectScreenHookRuntime", () => {
  it("builds render/context-bar inputs and resolves placeholder titles", () => {
    const renderInput = buildInspectScreenRenderStateInput({
      mode: "track",
      track: null,
      repository: null,
      baseAsset: null,
      availableTracks: [],
      availableRepositories: [],
      availableBaseAssets: [],
    });
    const contextInput = buildInspectScreenContextBarInput({
      ...renderInput,
      t: en,
    });

    expect(renderInput.mode).toBe("track");
    expect(contextInput.t).toBe(en);
    expect(resolveInspectScreenPlaceholderTitle({ kind: "track-placeholder", t: en })).toBe(
      en.inspect.noTrackSelected,
    );
    expect(resolveInspectScreenPlaceholderTitle({ kind: "repo-placeholder", t: en })).toBe(
      en.inspect.noRepoSelected,
    );
    expect(resolveInspectScreenPlaceholderTitle({ kind: "base-placeholder", t: en })).toBe(
      en.inspect.noBaseAssetSelected,
    );
  });

  it("builds element/view inputs without mutating the contract", () => {
    const contextBarProps = {
      mode: "track",
      trackCount: 1,
      repositoryCount: 1,
      baseAssetCount: 1,
      selectedTrackId: "track-1",
      selectedRepositoryId: "repo-1",
      selectedBaseAssetId: "base-1",
      trackOptions: [],
      repositoryOptions: [],
      baseAssetOptions: [],
      labels: {
        tracks: "Tracks",
        logSources: "Logs",
        bases: "Bases",
      },
    } as const;

    const contextElementInput = buildInspectScreenContextBarElementInput({
      contextBarProps,
      onChangeMode: vi.fn(),
      onSelectTrack: vi.fn(),
      onSelectRepository: vi.fn(),
      onSelectBaseAsset: vi.fn(),
    });
    const trackInput = buildInspectScreenTrackViewInput({
      track: { id: "track-1" } as never,
      analyzerLabel: "Analyzer",
      trackMutating: false,
      contextBar: "ctx",
      onGoCompose: vi.fn(),
      onUpdateTrackPerformance: vi.fn(async () => undefined),
      onUpdateTrackAnalysis: vi.fn(async () => undefined),
    });
    const repositoryInput = buildInspectScreenRepositoryViewInput({
      repository: { id: "repo-1" } as never,
      availableBaseAssets: [],
      availableTracks: [],
      availablePlaylists: [],
      preferredBaseAssetId: null,
      analyzerLabel: "Analyzer",
      contextBar: "ctx",
      onGoCompose: vi.fn(),
    });
    const baseInput = buildInspectScreenBaseAssetViewInput({
      baseAsset: { id: "base-1" } as never,
      analyzerLabel: "Analyzer",
      contextBar: "ctx",
      onGoCompose: vi.fn(),
    });

    expect(contextElementInput.contextBarProps).toBe(contextBarProps);
    expect(trackInput.track.id).toBe("track-1");
    expect(repositoryInput.repository.id).toBe("repo-1");
    expect(baseInput.baseAsset.id).toBe("base-1");
  });
});
