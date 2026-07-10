import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { LibraryTabContent } from "../../src/features/library/components/LibraryTabContent";

const {
  playlistsPanelMock,
  tracksPanelMock,
  sourcesPanelMock,
  connectionsPanelMock,
  baseAssetsPanelMock,
} = vi.hoisted(() => ({
  playlistsPanelMock: vi.fn(),
  tracksPanelMock: vi.fn(),
  sourcesPanelMock: vi.fn(),
  connectionsPanelMock: vi.fn(),
  baseAssetsPanelMock: vi.fn(),
}));

vi.mock("../../src/features/library/components/LibraryEmptyState", () => ({
  LibraryEmptyState: ({
    title,
    body,
    action,
  }: {
    title: string;
    body: string;
    action: ReactNode;
  }) => (
    <div data-testid="library-empty-state">
      <strong>{title}</strong>
      <span>{body}</span>
      {action}
    </div>
  ),
}));

vi.mock("../../src/features/library/components/LibraryPlaylistsPanel", () => ({
  LibraryPlaylistsPanel: (props: unknown) => {
    playlistsPanelMock(props);
    return <div data-testid="library-playlists-panel" />;
  },
}));

vi.mock("../../src/features/library/components/LibraryTracksListPanel", () => ({
  LibraryTracksListPanel: (props: unknown) => {
    tracksPanelMock(props);
    return <div data-testid="library-tracks-panel" />;
  },
}));

vi.mock("../../src/features/library/components/LibrarySourcesListPanel", () => ({
  LibrarySourcesListPanel: (props: unknown) => {
    sourcesPanelMock(props);
    return <div data-testid="library-sources-panel" />;
  },
}));

vi.mock("../../src/features/library/components/LibraryConnectionsListPanel", () => ({
  LibraryConnectionsListPanel: (props: unknown) => {
    connectionsPanelMock(props);
    return <div data-testid="library-connections-panel" />;
  },
}));

vi.mock("../../src/features/library/components/LibraryBaseAssetsListPanel", () => ({
  LibraryBaseAssetsListPanel: (props: unknown) => {
    baseAssetsPanelMock(props);
    return <div data-testid="library-base-assets-panel" />;
  },
}));

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

function createProps() {
  return {
    tab: "tracks" as const,
    loading: false,
    loadingLabel: "Loading library",
    emptyState: {
      title: "Nothing here",
      body: "Add your first item",
      actionLabel: "Add",
    },
    newlyImportedId: null,
    tracks: [],
    playlists: [],
    repositories: [],
    baseAssets: [],
    selectedTrackId: null,
    selectedPlaylistId: null,
    selectedRepositoryId: null,
    selectedBaseAssetId: null,
    playlistEditorOpen: false,
    playlistEditorId: null,
    playlistName: "",
    playlistTrackIds: [],
    logConnections: [],
    onShowForm: vi.fn(),
    onDeleteTrack: vi.fn(),
    onInspectTrack: vi.fn(),
    onReanalyzeTrack: vi.fn(),
    onRelinkTrack: vi.fn(),
    onSelectTrack: vi.fn(),
    onDeleteRepository: vi.fn(),
    onInspectRepository: vi.fn(),
    onReanalyzeRepository: vi.fn(),
    onSelectRepository: vi.fn(),
    onDeleteConnection: vi.fn(),
    onInspectBaseAsset: vi.fn(),
    onSelectBaseAsset: vi.fn(),
    onDeletePlaylist: vi.fn(),
    onOpenPlaylistEditor: vi.fn(),
    onResetPlaylistEditor: vi.fn(),
    onSavePlaylist: vi.fn(),
    onSelectPlaylist: vi.fn(),
    onSetPlaylistName: vi.fn(),
    onTogglePlaylistTrack: vi.fn(),
  };
}

describe("LibraryTabContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a loading shell while the active tab is busy", () => {
    renderWithI18n(<LibraryTabContent {...createProps()} loading={true} />);

    expect(screen.getAllByText("Loading library").length).toBeGreaterThan(0);
  });

  it("renders the empty state CTA and opens the form from the tracks tab", () => {
    const props = createProps();

    renderWithI18n(<LibraryTabContent {...props} />);

    expect(screen.getByTestId("library-empty-state")).toBeInTheDocument();
    expect(screen.getByText("Nothing here")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(props.onShowForm).toHaveBeenCalledTimes(1);
  });

  it("renders track playlists and track list panels when tracks exist", () => {
    const props = createProps();
    const track = { id: "track-1", title: "Track 1" } as never;
    const playlist = { id: "playlist-1", name: "Set A" } as never;

    renderWithI18n(
      <LibraryTabContent
        {...props}
        newlyImportedId="track-1"
        tracks={[track]}
        playlists={[playlist]}
        selectedTrackId="track-1"
        selectedPlaylistId="playlist-1"
        playlistEditorOpen={true}
        playlistEditorId="playlist-1"
        playlistName="Set A"
        playlistTrackIds={["track-1"]}
      />,
    );

    expect(screen.getByTestId("library-playlists-panel")).toBeInTheDocument();
    expect(screen.getByTestId("library-tracks-panel")).toBeInTheDocument();
    expect(playlistsPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        playlists: [playlist],
        selectedPlaylistId: "playlist-1",
        playlistEditorOpen: true,
        playlistEditorId: "playlist-1",
        playlistName: "Set A",
        playlistTrackIds: ["track-1"],
        tracks: [track],
      }),
    );
    expect(tracksPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tracks: [track],
        newlyImportedId: "track-1",
        selectedTrackId: "track-1",
      }),
    );
  });

  it("renders empty states for sources, connections, and base assets tabs", () => {
    const sourceProps = createProps();
    const sourceView = renderWithI18n(<LibraryTabContent {...sourceProps} tab="sources" />);
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(sourceProps.onShowForm).toHaveBeenCalledTimes(1);
    sourceView.unmount();

    const connectionProps = createProps();
    const connectionView = renderWithI18n(
      <LibraryTabContent {...connectionProps} tab="connections" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(connectionProps.onShowForm).toHaveBeenCalledTimes(1);
    connectionView.unmount();

    const assetProps = createProps();
    renderWithI18n(<LibraryTabContent {...assetProps} tab="bases" />);
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(assetProps.onShowForm).toHaveBeenCalledTimes(1);
  });

  it("renders the sources panel with delegated repository props", () => {
    const props = createProps();
    const repository = { id: "repo-1", path: "/tmp/repo" } as never;

    renderWithI18n(
      <LibraryTabContent
        {...props}
        tab="sources"
        newlyImportedId="repo-1"
        repositories={[repository]}
        selectedRepositoryId="repo-1"
      />,
    );

    expect(screen.getByTestId("library-sources-panel")).toBeInTheDocument();
    expect(sourcesPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repositories: [repository],
        newlyImportedId: "repo-1",
        selectedRepositoryId: "repo-1",
      }),
    );
  });

  it("renders the connections panel with delegated connection props", () => {
    const props = createProps();
    const connection = { id: "conn-1", name: "Tail A" } as never;

    renderWithI18n(
      <LibraryTabContent {...props} tab="connections" logConnections={[connection]} />,
    );

    expect(screen.getByTestId("library-connections-panel")).toBeInTheDocument();
    expect(connectionsPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connections: [connection],
        onDeleteConnection: props.onDeleteConnection,
      }),
    );
  });

  it("renders the base assets panel with delegated asset props", () => {
    const props = createProps();
    const asset = { id: "asset-1", label: "Drone Stem" } as never;

    renderWithI18n(
      <LibraryTabContent
        {...props}
        tab="bases"
        newlyImportedId="asset-1"
        baseAssets={[asset]}
        selectedBaseAssetId="asset-1"
      />,
    );

    expect(screen.getByTestId("library-base-assets-panel")).toBeInTheDocument();
    expect(baseAssetsPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: [asset],
        newlyImportedId: "asset-1",
        selectedBaseAssetId: "asset-1",
      }),
    );
  });
});
