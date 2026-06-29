import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppCurateSection } from "../src/AppCurateSection";

const childMocks = vi.hoisted(() => ({
  SimpleModeWizard: vi.fn(),
  SimpleModeLibraryView: vi.fn(),
  LibraryScreen: vi.fn(),
}));

vi.mock("../src/features/simple/SimpleModeWizard", () => ({
  SimpleModeWizard: (props: Record<string, unknown>) => {
    childMocks.SimpleModeWizard(props);
    return <div data-testid="simple-wizard">simple-wizard</div>;
  },
}));

vi.mock("../src/features/simple/SimpleModeLibraryView", () => ({
  SimpleModeLibraryView: (props: Record<string, unknown>) => {
    childMocks.SimpleModeLibraryView(props);
    return <div data-testid="simple-library">simple-library</div>;
  },
}));

vi.mock("../src/features/library/LibraryScreen", () => ({
  LibraryScreen: (props: Record<string, unknown>) => {
    childMocks.LibraryScreen(props);
    return <div data-testid="expert-library">expert-library</div>;
  },
}));

function createProps() {
  return {
    userMode: "simple" as const,
    showSimpleWizard: false,
    showSimpleLibrary: false,
    showExpertLibrary: false,
    manifest: {
      baseAssetCategories: [{ id: "fx", label: "FX" }],
      defaultBaseAssetCategoryId: "fx",
    } as never,
    musicStyles: [],
    baseAssetCategories: [],
    defaultTrackMusicStyleId: "house",
    defaultBaseAssetCategoryId: "fx",
    libraryTab: "tracks" as const,
    tracks: [],
    playlists: [],
    repositories: [],
    baseAssets: [],
    compositions: [],
    newlyImportedId: null,
    selectedTrackId: null,
    selectedPlaylistId: null,
    selectedRepositoryId: "repo-1",
    selectedBaseAssetId: null,
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
    onStartSimpleMonitoring: vi.fn(),
    onStartSimpleWizardSession: vi.fn(),
    onTabChange: vi.fn(),
  };
}

describe("AppCurateSection", () => {
  it("renders only the enabled surfaces and wires the simple wizard callback", async () => {
    const props = createProps();
    render(<AppCurateSection {...props} showSimpleWizard={true} showSimpleLibrary={true} />);

    expect(screen.getByTestId("simple-wizard")).toBeInTheDocument();
    expect(screen.getByTestId("simple-library")).toBeInTheDocument();
    expect(screen.queryByTestId("expert-library")).not.toBeInTheDocument();

    const wizardProps = childMocks.SimpleModeWizard.mock.calls[0]?.[0] as {
      onStartSession: (repoId: string, presetId: string) => Promise<void>;
      repositoryCount: number;
      baseAssetCount: number;
      defaultCategoryId?: string;
    };
    await wizardProps.onStartSession("repo-1", "balanced");
    expect(props.onStartSimpleWizardSession).toHaveBeenCalledWith("repo-1", "balanced");
    expect(wizardProps.repositoryCount).toBe(0);
    expect(wizardProps.baseAssetCount).toBe(0);
    expect(wizardProps.defaultCategoryId).toBe("fx");
  });

  it("passes expert-library props through when the expert surface is enabled", () => {
    const props = createProps();
    render(
      <AppCurateSection
        {...props}
        showExpertLibrary={true}
        tracks={[{ id: "track-1" } as never]}
        repositories={[{ id: "repo-1" } as never]}
      />,
    );

    expect(screen.getByTestId("expert-library")).toBeInTheDocument();
    expect(childMocks.LibraryScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        activeTab: "tracks",
        defaultTrackMusicStyleId: "house",
        selectedRepositoryId: "repo-1",
        tracks: [{ id: "track-1" }],
        repositories: [{ id: "repo-1" }],
        onTabChange: props.onTabChange,
      }),
    );
  });
});
