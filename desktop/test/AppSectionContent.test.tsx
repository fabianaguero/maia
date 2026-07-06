import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppSectionContent } from "../src/AppSectionContent";
import type { AppSectionContentProps } from "../src/AppSectionContent";

vi.mock("../src/AppCurateSection", () => ({
  AppCurateSection: (props: {
    userMode: "simple" | "expert";
    showSimpleWizard: boolean;
    showSimpleLibrary: boolean;
    showExpertLibrary: boolean;
  }) => (
    <div data-testid="curate">
      {props.userMode}::{String(props.showSimpleWizard)}::{String(props.showSimpleLibrary)}::
      {String(props.showExpertLibrary)}
    </div>
  ),
}));

vi.mock("../src/AppSessionSection", () => ({
  AppSessionSection: (props: {
    monitorPlaybackProgress: number | null;
    selectedSessionId: string | null;
  }) => (
    <div data-testid="session">
      {String(props.monitorPlaybackProgress)}::{props.selectedSessionId ?? "none"}
    </div>
  ),
}));

vi.mock("../src/features/compose/ComposeScreen", () => ({
  ComposeScreen: (props: { analyzerLabel: string }) => (
    <div data-testid="compose">compose::{props.analyzerLabel}</div>
  ),
}));

vi.mock("../src/features/inspect/InspectScreen", () => ({
  InspectScreen: (props: { analyzerLabel: string; mode: string }) => (
    <div data-testid="inspect">
      inspect::{props.analyzerLabel}::{props.mode}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function createProps(overrides: Partial<AppSectionContentProps> = {}): AppSectionContentProps {
  return {
    userMode: "expert",
    effectivePillar: "curate",
    effectiveScreen: "library",
    monitorSession: null,
    monitorIsPlayback: false,
    monitorPlaybackProgress: null,
    manifest: null,
    musicStyles: [],
    baseAssetCategories: [],
    defaultTrackMusicStyleId: "house",
    defaultBaseAssetCategoryId: "fx",
    libraryTab: "tracks",
    tracks: [],
    playlists: [],
    repositories: [{ id: "repo-1" } as never],
    baseAssets: [],
    compositions: [],
    newlyImportedId: null,
    selectedTrack: null,
    selectedTrackId: null,
    selectedPlaylistId: null,
    selectedRepository: null,
    selectedRepositoryId: null,
    selectedBaseAsset: null,
    selectedBaseAssetId: null,
    selectedComposition: null,
    selectedCompositionId: null,
    trackLoading: false,
    repositoryLoading: false,
    baseAssetLoading: false,
    compositionLoading: false,
    trackBusy: false,
    repositoryBusy: false,
    baseAssetBusy: false,
    compositionBusy: false,
    trackError: null,
    repositoryError: null,
    baseAssetError: null,
    compositionError: null,
    analysisMode: "track",
    analyzerLabel: "Analyzer",
    sessionBookmarksBySessionId: {},
    sessions: [],
    selectedSessionId: null,
    sessionsLoading: false,
    sessionsMutating: false,
    sessionsError: null,
    onImportTrack: vi.fn(async () => true),
    onImportRepository: vi.fn(async () => true),
    onImportBaseAsset: vi.fn(async () => true),
    onImportComposition: vi.fn(async () => true),
    onReanalyzeTrack: vi.fn(async () => true),
    onRelinkTrack: vi.fn(async () => true),
    onRelinkMissingTracks: vi.fn(async () => true),
    onReanalyzeRepository: vi.fn(async () => true),
    onDeleteTrack: vi.fn(async () => true),
    onDeleteRepository: vi.fn(async () => true),
    onSeedDemo: vi.fn(async () => undefined),
    onSavePlaylist: vi.fn(async () => true),
    onDeletePlaylist: vi.fn(async () => true),
    onSelectSimpleTrack: vi.fn(),
    onSelectSimpleRepository: vi.fn(),
    onSelectTrack: vi.fn(),
    onSelectPlaylist: vi.fn(),
    onSelectRepository: vi.fn(),
    onSelectBaseAsset: vi.fn(),
    onSelectComposition: vi.fn(),
    onInspectTrack: vi.fn(),
    onInspectRepository: vi.fn(),
    onInspectBaseAsset: vi.fn(),
    onInspectComposition: vi.fn(),
    onGoLibrary: vi.fn(),
    onGoCompose: vi.fn(),
    onTabChange: vi.fn(),
    onChangeAnalysisMode: vi.fn(),
    onUpdateTrackPerformance: vi.fn(async () => undefined),
    onUpdateTrackAnalysis: vi.fn(async () => undefined),
    onStartSimpleMonitoring: vi.fn(),
    onStartSimpleWizardSession: vi.fn(),
    onStartSession: vi.fn(async () => true),
    onStopSession: vi.fn(async () => undefined),
    onResumeSession: vi.fn(),
    onPlaybackSession: vi.fn(async () => true),
    onReplayBookmark: vi.fn(async () => true),
    onDeleteSession: vi.fn(async () => undefined),
    onSelectSession: vi.fn(),
    ...overrides,
  };
}

function renderSection(overrides: Partial<AppSectionContentProps> = {}) {
  return render(
    <Suspense fallback={<div data-testid="loading">loading</div>}>
      <AppSectionContent {...createProps(overrides)} />
    </Suspense>,
  );
}

describe("AppSectionContent", () => {
  it("renders curate plus inspect when the expert user is in inspect mode", async () => {
    renderSection({
      effectivePillar: "curate",
      effectiveScreen: "inspect",
      analysisMode: "repo",
    });

    await waitFor(() => {
      expect(screen.getByTestId("curate")).toHaveTextContent("expert::false::false::false");
      expect(screen.getByTestId("inspect")).toHaveTextContent("inspect::Analyzer::repo");
    });
    expect(screen.queryByTestId("compose")).not.toBeInTheDocument();
    expect(screen.queryByTestId("session")).not.toBeInTheDocument();
  });

  it("renders compose for the design pillar", async () => {
    renderSection({
      effectivePillar: "design",
      effectiveScreen: "compose",
      compositionBusy: true,
    });

    await waitFor(() => {
      expect(screen.getByTestId("curate")).toBeInTheDocument();
      expect(screen.getByTestId("compose")).toHaveTextContent("compose::Analyzer");
    });
    expect(screen.queryByTestId("inspect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("session")).not.toBeInTheDocument();
  });

  it("renders session for the perform pillar and keeps inspect/compose hidden", () => {
    renderSection({
      effectivePillar: "perform",
      effectiveScreen: "session",
      monitorSession: { sessionId: "live-1", persistedSessionId: "persisted-1" } as never,
      monitorIsPlayback: true,
      monitorPlaybackProgress: 0.75,
      selectedSessionId: "persisted-1",
      sessions: [{ id: "persisted-1" } as never],
    });

    expect(screen.getByTestId("curate")).toBeInTheDocument();
    expect(screen.getByTestId("session")).toHaveTextContent("0.75::persisted-1");
    expect(screen.queryByTestId("inspect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("compose")).not.toBeInTheDocument();
  });
});
