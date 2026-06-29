import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LibraryScreen } from "../../src/features/library/LibraryScreen";

const useLibraryScreenController = vi.fn();

vi.mock("../../src/features/library/useLibraryScreenController", () => ({
  useLibraryScreenController: (...args: unknown[]) => useLibraryScreenController(...args),
}));

vi.mock("../../src/features/library/LibraryTabStrip", () => ({
  LibraryTabStrip: ({ activeTab }: { activeTab: string }) => (
    <div data-testid="library-tab-strip">{activeTab}</div>
  ),
}));

vi.mock("../../src/features/library/components/LibraryToolbar", () => ({
  LibraryToolbar: ({ title, count }: { title: string; count: string }) => (
    <div data-testid="library-toolbar">
      {title}:{count}
    </div>
  ),
}));

vi.mock("../../src/features/library/components/LibraryFormDrawer", () => ({
  LibraryFormDrawer: ({ visible }: { visible: boolean }) => (
    <div data-testid="library-form-drawer">{visible ? "open" : "closed"}</div>
  ),
}));

vi.mock("../../src/features/library/components/LibraryTabContent", () => ({
  LibraryTabContent: ({ tab, loading }: { tab: string; loading: boolean }) => (
    <div data-testid="library-tab-content">
      {tab}:{loading ? "loading" : "ready"}
    </div>
  ),
}));

function createControllerState() {
  return {
    t: {
      library: {
        title: "Library",
        copy: "Curate tracks, sources and profiles.",
        loading: "Loading",
      },
    },
    tab: "tracks",
    viewModel: {
      tabs: [{ id: "tracks", label: "Tracks", count: 2 }],
      toolbar: {
        eyebrow: "Tracks",
        count: 2,
        title: "Track catalog",
        note: "Ready for selection",
      },
      emptyState: {
        title: "Empty",
        body: "No items",
        actionLabel: "Add",
      },
      loading: false,
      error: null,
    },
    toolbarActions: [],
    showForm: false,
    setShowForm: vi.fn(),
    handleTabChange: vi.fn(),
    handleImportTrack: vi.fn(),
    handleImportRepository: vi.fn(),
    handleImportBaseAsset: vi.fn(),
    refreshLogConnections: vi.fn(),
    logConnections: [],
    playlistEditorOpen: false,
    playlistEditorId: null,
    playlistName: "",
    setPlaylistName: vi.fn(),
    playlistTrackIds: [],
    openPlaylistEditor: vi.fn(),
    resetPlaylistEditor: vi.fn(),
    togglePlaylistTrack: vi.fn(),
    handleSavePlaylist: vi.fn(),
    handleDeleteLogConnection: vi.fn(),
    selectedTrackId: null,
    selectedPlaylistId: null,
    selectedRepositoryId: null,
    selectedBaseAssetId: null,
    newlyImportedId: null,
    tracks: [],
    playlists: [],
    repositories: [],
    baseAssets: [],
    onDeleteTrack: vi.fn(),
    onInspectTrack: vi.fn(),
    onReanalyzeTrack: vi.fn(),
    onRelinkTrack: vi.fn(),
    onSelectTrack: vi.fn(),
    onDeleteRepository: vi.fn(),
    onInspectRepository: vi.fn(),
    onReanalyzeRepository: vi.fn(),
    onSelectRepository: vi.fn(),
    onInspectBaseAsset: vi.fn(),
    onSelectBaseAsset: vi.fn(),
    onDeletePlaylist: vi.fn(),
    onSelectPlaylist: vi.fn(),
  };
}

describe("LibraryScreen", () => {
  it("renders the slim shell around the controller state", () => {
    useLibraryScreenController.mockReturnValue(createControllerState());

    render(
      <LibraryScreen
        tracks={[]}
        playlists={[]}
        repositories={[]}
        baseAssets={[]}
        compositions={[]}
        selectedTrackId={null}
        selectedPlaylistId={null}
        selectedRepositoryId={null}
        selectedBaseAssetId={null}
        selectedCompositionId={null}
        manifest={null}
        musicStyles={[]}
        baseAssetCategories={[]}
        trackLoading={false}
        repositoryLoading={false}
        baseAssetLoading={false}
        compositionLoading={false}
        trackBusy={false}
        repositoryBusy={false}
        baseAssetBusy={false}
        compositionBusy={false}
        trackError={null}
        repositoryError={null}
        baseAssetError={null}
        compositionError={null}
        onImportTrack={vi.fn()}
        onImportRepository={vi.fn()}
        onImportBaseAsset={vi.fn()}
        onImportComposition={vi.fn()}
        onReanalyzeTrack={vi.fn()}
        onRelinkTrack={vi.fn()}
        onRelinkMissingTracks={vi.fn()}
        onReanalyzeRepository={vi.fn()}
        onDeleteTrack={vi.fn()}
        onDeleteRepository={vi.fn()}
        onSeedDemo={vi.fn()}
        onSavePlaylist={vi.fn()}
        onDeletePlaylist={vi.fn()}
        onSelectTrack={vi.fn()}
        onSelectPlaylist={vi.fn()}
        onSelectRepository={vi.fn()}
        onSelectBaseAsset={vi.fn()}
        onSelectComposition={vi.fn()}
        onInspectTrack={vi.fn()}
        onInspectRepository={vi.fn()}
        onInspectBaseAsset={vi.fn()}
        onInspectComposition={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByText("Curate tracks, sources and profiles.")).toBeInTheDocument();
    expect(screen.getByTestId("library-tab-strip")).toHaveTextContent("tracks");
    expect(screen.getByTestId("library-toolbar")).toHaveTextContent("Track catalog:2");
    expect(screen.getByTestId("library-form-drawer")).toHaveTextContent("closed");
    expect(screen.getByTestId("library-tab-content")).toHaveTextContent("tracks:ready");
  });
});
