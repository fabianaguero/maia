import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildImportCompositionInput,
  buildImportCompositionResetState,
  deriveDefaultBaseAssetId,
  resolveCompositionReference,
  resolveImportCompositionSubmitDisabled,
  resolveInitialCompositionBaseMode,
  resolveValidCompositionBaseMode,
  resolveValidCompositionSelection,
  validateImportCompositionForm,
} from "../../src/features/library/components/importCompositionFormRuntime";

describe("importCompositionFormRuntime", () => {
  it("resolves defaults and keeps selections valid", () => {
    expect(
      deriveDefaultBaseAssetId([
        { id: "a", reusable: false },
        { id: "b", reusable: true },
      ] as never),
    ).toBe("b");
    expect(
      resolveInitialCompositionBaseMode({ tracks: [{}] as never, playlists: [] as never }),
    ).toBe("track");
    expect(
      resolveInitialCompositionBaseMode({ tracks: [] as never, playlists: [{}] as never }),
    ).toBe("playlist");
    expect(resolveValidCompositionSelection("x", [{ id: "a" }, { id: "b" }])).toBe("a");
    expect(
      resolveValidCompositionBaseMode({
        baseMode: "track",
        tracks: [] as never,
        playlists: [{ id: "p" }] as never,
      }),
    ).toBe("playlist");
  });

  it("validates and builds composition import payloads", () => {
    expect(
      validateImportCompositionForm({
        t: en,
        baseAssetId: "",
        baseMode: "track",
        trackId: "",
        playlistId: "",
      }),
    ).toBe(en.compose.forms.baseAssetRequiredError);

    expect(
      resolveCompositionReference({
        baseMode: "playlist",
        trackId: "track-1",
        playlistId: "playlist-1",
        structureId: "",
      }),
    ).toEqual({
      referenceType: "playlist",
      referenceAssetId: "playlist-1",
    });

    expect(
      buildImportCompositionInput({
        baseAssetId: "base-1",
        baseMode: "track",
        trackId: "track-1",
        playlistId: "playlist-1",
        structureId: "repo-1",
        label: " Night shift ",
      }),
    ).toEqual({
      baseAssetId: "base-1",
      trackId: "track-1",
      playlistId: undefined,
      structureId: "repo-1",
      referenceType: "repo",
      referenceAssetId: "repo-1",
      label: "Night shift",
    });

    expect(
      resolveImportCompositionSubmitDisabled({
        busy: false,
        baseAssets: [{ id: "base-1" }] as never,
        baseMode: "track",
        trackId: "track-1",
        playlistId: "",
      }),
    ).toBe(false);

    expect(buildImportCompositionResetState()).toEqual({
      label: "",
    });
  });
});
