import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { InspectScreen } from "../../src/features/inspect/InspectScreen";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../src/types/library";

vi.mock("../../src/features/inspect/InspectContextBar", () => ({
  InspectContextBar: ({ mode }: { mode: string }) => <div data-testid="inspect-context-bar">{mode}</div>,
}));

vi.mock("../../src/features/inspect/InspectEmptyState", () => ({
  InspectEmptyState: ({ title }: { title: string }) => <div data-testid="inspect-empty-state">{title}</div>,
}));

vi.mock("../../src/features/inspect/InspectTrackView", () => ({
  InspectTrackView: ({ track }: { track: { id: string } }) => <div data-testid="inspect-track-view">{track.id}</div>,
}));

vi.mock("../../src/features/inspect/InspectRepositoryView", () => ({
  InspectRepositoryView: ({ repository }: { repository: { id: string } }) => (
    <div data-testid="inspect-repository-view">{repository.id}</div>
  ),
}));

vi.mock("../../src/features/inspect/InspectBaseAssetView", () => ({
  InspectBaseAssetView: ({ baseAsset }: { baseAsset: { id: string } }) => (
    <div data-testid="inspect-base-asset-view">{baseAsset.id}</div>
  ),
}));

const track: LibraryTrack = {
  id: "track-1",
  title: "Night run",
  sourcePath: "/music/night-run.wav",
  storagePath: "/storage/night-run.json",
  importedAt: "2026-06-20T10:00:00.000Z",
  bpm: 126,
  bpmConfidence: 0.9,
  durationSeconds: 240,
  waveformBins: [0.2],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
  analyzerStatus: "ready",
  repoSuggestedBpm: 126,
  repoSuggestedStatus: "aligned",
  notes: [],
  fileExtension: "wav",
  analysisMode: "full",
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: "Am",
  energyLevel: 0.8,
  danceability: 0.7,
  structuralPatterns: [],
  file: {
    sourcePath: "/music/night-run.wav",
    storagePath: "/storage/night-run.json",
    sourceKind: "file",
    fileExtension: "wav",
    sizeBytes: 1000,
    modifiedAt: null,
    checksum: null,
    availabilityState: "available",
    playbackSource: "source_file",
  },
  tags: {
    title: "Night run",
    artist: "Maia",
    album: null,
    genre: "House",
    year: 2026,
    comment: null,
    artworkPath: null,
    musicStyleId: "house",
    musicStyleLabel: "House",
  },
  analysis: {
    importedAt: "2026-06-20T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.9,
    durationSeconds: 240,
    waveformBins: [0.2],
    beatGrid: [{ index: 0, second: 0 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    analyzerStatus: "ready",
    analysisMode: "full",
    analyzerVersion: "1.0.0",
    analyzedAt: "2026-06-20T10:00:00.000Z",
    repoSuggestedBpm: 126,
    repoSuggestedStatus: "aligned",
    notes: [],
    keySignature: "Am",
    energyLevel: 0.8,
    danceability: 0.7,
    structuralPatterns: [],
  },
  performance: {
    color: null,
    rating: 4,
    playCount: 0,
    lastPlayedAt: null,
    bpmLock: false,
    gridLock: false,
    mainCueSecond: null,
    hotCues: [],
    memoryCues: [],
    savedLoops: [],
  },
};

const repository: RepositoryAnalysis = {
  id: "repo-1",
  title: "orders.log",
  sourcePath: "/logs/orders.log",
  storagePath: "/storage/orders.json",
  sourceKind: "file",
  importedAt: "2026-06-20T10:00:00.000Z",
  suggestedBpm: 126,
  confidence: 0.75,
  summary: "Passive log stream",
  analyzerStatus: "ready",
  buildSystem: "spring",
  primaryLanguage: "java",
  javaFileCount: 10,
  testFileCount: 4,
  waveformBins: [0.2],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
  notes: [],
  tags: ["logs"],
  metrics: {},
};

const baseAsset: BaseAssetRecord = {
  id: "base-1",
  title: "Base groove",
  sourcePath: "/assets/base.wav",
  storagePath: "/storage/base.json",
  sourceKind: "file",
  importedAt: "2026-06-20T10:00:00.000Z",
  categoryId: "drums",
  categoryLabel: "Drums",
  reusable: true,
  entryCount: 12,
  checksum: null,
  confidence: 0.91,
  summary: "Groove pack",
  analyzerStatus: "ready",
  notes: [],
  tags: ["base"],
  metrics: {},
};

const playlists: BaseTrackPlaylist[] = [];

function renderInspectScreen(overrides: Partial<ComponentProps<typeof InspectScreen>> = {}) {
  const props: ComponentProps<typeof InspectScreen> = {
    track: null,
    repository: null,
    baseAsset: null,
    availableTracks: [],
    availablePlaylists: playlists,
    availableRepositories: [],
    availableBaseAssets: [],
    mode: "track",
    analyzerLabel: "Maia Analyzer",
    onChangeMode: vi.fn(),
    onSelectTrack: vi.fn(),
    onSelectRepository: vi.fn(),
    onSelectBaseAsset: vi.fn(),
    onGoLibrary: vi.fn(),
    onGoCompose: vi.fn(),
    onUpdateTrackPerformance: vi.fn(async () => undefined),
    onUpdateTrackAnalysis: vi.fn(async () => undefined),
    trackMutating: false,
    ...overrides,
  };

  render(
    <I18nContext.Provider value={en}>
      <InspectScreen {...props} />
    </I18nContext.Provider>,
  );

  return props;
}

describe("InspectScreen", () => {
  it("renders the empty state when there are no assets to inspect", () => {
    renderInspectScreen();

    expect(screen.getByTestId("inspect-empty-state")).toHaveTextContent(en.inspect.nothingYet);
  });

  it("renders selection placeholders when a mode has inventory but no active item", () => {
    renderInspectScreen({
      mode: "track",
      availableTracks: [track],
    });

    expect(screen.getByText(en.inspect.noTrackSelected)).toBeInTheDocument();
    expect(screen.getByTestId("inspect-context-bar")).toHaveTextContent("track");
  });

  it("routes to repository and base-asset detail views for active selections", () => {
    const { rerender } = render(
      <I18nContext.Provider value={en}>
        <InspectScreen
          track={null}
          repository={repository}
          baseAsset={null}
          availableTracks={[track]}
          availablePlaylists={playlists}
          availableRepositories={[repository]}
          availableBaseAssets={[baseAsset]}
          mode="repo"
          analyzerLabel="Maia Analyzer"
          onChangeMode={vi.fn()}
          onSelectTrack={vi.fn()}
          onSelectRepository={vi.fn()}
          onSelectBaseAsset={vi.fn()}
          onGoLibrary={vi.fn()}
          onGoCompose={vi.fn()}
          onUpdateTrackPerformance={vi.fn(async () => undefined)}
          onUpdateTrackAnalysis={vi.fn(async () => undefined)}
          trackMutating={false}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByTestId("inspect-repository-view")).toHaveTextContent("repo-1");

    rerender(
      <I18nContext.Provider value={en}>
        <InspectScreen
          track={null}
          repository={null}
          baseAsset={baseAsset}
          availableTracks={[track]}
          availablePlaylists={playlists}
          availableRepositories={[repository]}
          availableBaseAssets={[baseAsset]}
          mode="base"
          analyzerLabel="Maia Analyzer"
          onChangeMode={vi.fn()}
          onSelectTrack={vi.fn()}
          onSelectRepository={vi.fn()}
          onSelectBaseAsset={vi.fn()}
          onGoLibrary={vi.fn()}
          onGoCompose={vi.fn()}
          onUpdateTrackPerformance={vi.fn(async () => undefined)}
          onUpdateTrackAnalysis={vi.fn(async () => undefined)}
          trackMutating={false}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByTestId("inspect-base-asset-view")).toHaveTextContent("base-1");
  });
});
