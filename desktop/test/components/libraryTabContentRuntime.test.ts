import { describe, expect, it } from "vitest";

import {
  buildLibraryTabContentState,
  resolveLibraryTabEmptyIconKind,
} from "../../src/features/library/components/libraryTabContentRuntime";

describe("libraryTabContentRuntime", () => {
  it("resolves the empty-state icon by tab", () => {
    expect(resolveLibraryTabEmptyIconKind("tracks")).toBe("tracks");
    expect(resolveLibraryTabEmptyIconKind("sources")).toBe("sources");
    expect(resolveLibraryTabEmptyIconKind("connections")).toBe("connections");
    expect(resolveLibraryTabEmptyIconKind("bases")).toBe("bases");
  });

  it("returns loading when the library tab is busy", () => {
    expect(
      buildLibraryTabContentState({
        tab: "tracks",
        loading: true,
        trackCount: 1,
        repositoryCount: 1,
        connectionCount: 1,
        baseAssetCount: 1,
      }),
    ).toEqual({
      kind: "loading",
      emptyIconKind: null,
    });
  });

  it("returns content kinds only when the selected tab has data", () => {
    expect(
      buildLibraryTabContentState({
        tab: "tracks",
        loading: false,
        trackCount: 2,
        repositoryCount: 0,
        connectionCount: 0,
        baseAssetCount: 0,
      }),
    ).toEqual({
      kind: "tracks",
      emptyIconKind: "tracks",
    });

    expect(
      buildLibraryTabContentState({
        tab: "sources",
        loading: false,
        trackCount: 0,
        repositoryCount: 1,
        connectionCount: 0,
        baseAssetCount: 0,
      }),
    ).toEqual({
      kind: "sources",
      emptyIconKind: "sources",
    });

    expect(
      buildLibraryTabContentState({
        tab: "connections",
        loading: false,
        trackCount: 0,
        repositoryCount: 0,
        connectionCount: 1,
        baseAssetCount: 0,
      }),
    ).toEqual({
      kind: "connections",
      emptyIconKind: "connections",
    });

    expect(
      buildLibraryTabContentState({
        tab: "bases",
        loading: false,
        trackCount: 0,
        repositoryCount: 0,
        connectionCount: 0,
        baseAssetCount: 1,
      }),
    ).toEqual({
      kind: "bases",
      emptyIconKind: "bases",
    });
  });

  it("returns an empty state when the selected tab has no items", () => {
    expect(
      buildLibraryTabContentState({
        tab: "connections",
        loading: false,
        trackCount: 5,
        repositoryCount: 4,
        connectionCount: 0,
        baseAssetCount: 3,
      }),
    ).toEqual({
      kind: "empty",
      emptyIconKind: "connections",
    });
  });
});
