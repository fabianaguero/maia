import { describe, expect, it } from "vitest";

import { CONTRACT_VERSION, type AnalyzerResponse } from "../src/contracts";
import { en } from "../src/i18n/en";
import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../src/types/library";
import {
  buildAppContentStatusState,
  buildAppContentStatusViewModel,
  buildFallbackSessionRepository,
  resolveAppDetailDeckLabel,
  resolveAppContentRouteState,
  resolveAppMutationState,
  resolveAppMutationLabel,
  resolveAppOpenConnectionsState,
  resolveAppPillarNavigationState,
  resolveAppScreenLabel,
  resolveAppSelectedItemTitle,
  resolveSessionRepository,
} from "../src/appContentRuntime";

const track = {
  tags: { title: "Daft Punk - Around The World" },
} as LibraryTrack;

const repository = {
  title: "visits-service",
} as RepositoryAnalysis;

const baseAsset = {
  title: "Warehouse Techno Pack",
} as BaseAssetRecord;

const composition = {
  title: "Night Shift Session",
} as CompositionResultRecord;

const healthResponse: AnalyzerResponse = {
  contractVersion: CONTRACT_VERSION,
  requestId: "health-1",
  status: "ok",
  payload: {
    analyzerVersion: "1.2.3",
    runtime: "python3.12",
    supportedActions: ["health", "analyze"],
    modes: ["track", "repo"],
  },
  warnings: [],
};

describe("appContentRuntime", () => {
  it("normalizes simple mode routes away from inspect/compose", () => {
    expect(resolveAppContentRouteState("simple", "design", "compose")).toEqual({
      effectivePillar: "curate",
      effectiveScreen: "library",
    });

    expect(resolveAppContentRouteState("expert", "design", "compose")).toEqual({
      effectivePillar: "design",
      effectiveScreen: "compose",
    });
  });

  it("maps pillar changes into stable app navigation state", () => {
    expect(resolveAppPillarNavigationState("simple", "design")).toEqual({
      pillar: "curate",
      screen: "library",
    });
    expect(resolveAppPillarNavigationState("expert", "design")).toEqual({
      pillar: "design",
      screen: "compose",
    });
    expect(resolveAppPillarNavigationState("expert", "perform")).toEqual({
      pillar: "perform",
      screen: "session",
    });
  });

  it("resolves open-connections navigation state", () => {
    expect(resolveAppOpenConnectionsState()).toEqual({
      pillar: "curate",
      screen: "library",
      libraryTab: "connections",
    });
  });

  it("builds analyzer and deck labels from screen context", () => {
    const statusState = buildAppContentStatusState(
      {
        analysisMode: "repo",
        booting: false,
        health: healthResponse,
        screen: "inspect",
      },
      en,
    );
    const viewModel = buildAppContentStatusViewModel(
      {
        analysisMode: "repo",
        baseAsset: null,
        booting: false,
        composition: null,
        health: healthResponse,
        playlistName: null,
        repository,
        screen: "inspect",
        track,
      },
      en,
    );

    expect(statusState).toEqual({
      analyzerLabel: "1.2.3 on python3.12",
      screenLabel: en.nav.inspect.label,
      detailDeckLabel: en.appShell.sourceDeckArmed,
    });
    expect(viewModel.analyzerLabel).toBe("1.2.3 on python3.12");
    expect(viewModel.screenLabel).toBe(en.nav.inspect.label);
    expect(viewModel.detailDeckLabel).toBe(en.appShell.sourceDeckArmed);
    expect(viewModel.selectedItemTitle).toBe("visits-service");
  });

  it("prefers playlist, base asset, and composition titles by context", () => {
    expect(
      buildAppContentStatusViewModel(
        {
          analysisMode: "track",
          baseAsset: null,
          booting: true,
          composition: null,
          health: null,
          playlistName: "Closing Set",
          repository: null,
          screen: "library",
          track,
        },
        en,
      ).selectedItemTitle,
    ).toBe("Closing Set");

    expect(
      buildAppContentStatusViewModel(
        {
          analysisMode: "base",
          baseAsset,
          booting: false,
          composition: null,
          health: null,
          playlistName: null,
          repository: null,
          screen: "inspect",
          track,
        },
        en,
      ).selectedItemTitle,
    ).toBe("Warehouse Techno Pack");

    expect(
      buildAppContentStatusViewModel(
        {
          analysisMode: "track",
          baseAsset: null,
          booting: false,
          composition,
          health: null,
          playlistName: null,
          repository: null,
          screen: "compose",
          track,
        },
        en,
      ).selectedItemTitle,
    ).toBe("Night Shift Session");
  });

  it("derives mutation state with deterministic priority", () => {
    expect(
      resolveAppMutationLabel(
        {
          baseAssetsMutating: true,
          compositionsMutating: false,
          libraryMutating: false,
          repositoriesMutating: false,
        },
        en,
      ),
    ).toBe(en.appShell.poolIngest);

    expect(
      resolveAppMutationState(
        {
          baseAssetsMutating: false,
          compositionsMutating: true,
          libraryMutating: false,
          repositoriesMutating: false,
        },
        en,
      ),
    ).toEqual({
      isMutating: true,
      mutateLabel: en.appShell.renderingComposition,
    });

    expect(
      resolveAppMutationState(
        {
          baseAssetsMutating: false,
          compositionsMutating: false,
          libraryMutating: true,
          repositoriesMutating: true,
        },
        en,
      ),
    ).toEqual({
      isMutating: true,
      mutateLabel: en.appShell.scanningTrackDna,
    });
  });

  it("resolves screen, deck and selected item labels independently", () => {
    expect(resolveAppScreenLabel("compose", en)).toBe(en.nav.compose.label);
    expect(resolveAppDetailDeckLabel("base", en)).toBe(en.appShell.basePoolArmed);

    expect(
      resolveAppSelectedItemTitle({
        analysisMode: "track",
        baseAsset: null,
        composition: null,
        playlistName: null,
        repository: null,
        screen: "library",
        track,
      }),
    ).toBe("Daft Punk - Around The World");
  });

  it("builds a typed fallback repository for ad-hoc sessions", () => {
    expect(
      buildFallbackSessionRepository({
        adapterKind: "file",
        label: "customers-service.log",
        nowIso: "2026-06-25T00:00:00.000Z",
        sessionId: "session-1",
        source: "/tmp/customers-service.log",
      }),
    ).toMatchObject({
      id: "session-1",
      title: "customers-service.log",
      sourceKind: "file",
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
    });
  });

  it("reuses an existing repository before creating a fallback session source", () => {
    const existing = {
      id: "repo-1",
      title: "orders-service",
      sourcePath: "/tmp/orders.log",
    } as RepositoryAnalysis;

    expect(
      resolveSessionRepository({
        adapterKind: "process",
        label: "orders",
        nowIso: "2026-06-25T00:00:00.000Z",
        repositories: [existing],
        sessionId: "session-2",
        source: "/tmp/orders.log",
      }),
    ).toBe(existing);
  });
});
