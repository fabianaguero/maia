import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { ComposeScreen } from "../../src/features/compose/ComposeScreen";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../src/types/library";

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => ({
    seekGuideTrack: vi.fn(),
    playbackProgress: 0.42,
  }),
}));

vi.mock("../../src/features/library/components/ImportCompositionForm", () => ({
  ImportCompositionForm: () => <div data-testid="import-composition-form">form</div>,
}));

vi.mock("../../src/features/analyzer/components/WaveformPlaceholder", () => ({
  WaveformPlaceholder: () => <div data-testid="waveform-placeholder">wave</div>,
}));

vi.mock("../../src/features/analyzer/components/BpmCurvePanel", () => ({
  BpmCurvePanel: () => <div data-testid="bpm-curve-panel">bpm</div>,
}));

vi.mock("../../src/features/analyzer/components/CompositionTimelinePanel", () => ({
  CompositionTimelinePanel: () => <div data-testid="composition-timeline-panel">timeline</div>,
}));

vi.mock("../../src/features/analyzer/components/CompositionOverviewPanel", () => ({
  CompositionOverviewPanel: () => <div data-testid="composition-overview-panel">overview</div>,
}));

vi.mock("../../src/features/analyzer/components/CompositionRenderPreviewPanel", () => ({
  CompositionRenderPreviewPanel: ({ onTimeUpdate }: { onTimeUpdate: (value: number) => void }) => (
    <button
      type="button"
      data-testid="composition-render-preview-panel"
      onClick={() => onTimeUpdate(12)}
    >
      render
    </button>
  ),
}));

vi.mock("../../src/features/analyzer/components/ExportCompositionPanel", () => ({
  ExportCompositionPanel: () => <div data-testid="export-composition-panel">export</div>,
}));

vi.mock("../../src/features/analyzer/components/CompositionMetricsPanel", () => ({
  CompositionMetricsPanel: () => <div data-testid="composition-metrics-panel">metrics</div>,
}));

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

const track: LibraryTrack = {
  id: "track-1",
  title: "Night run",
  sourcePath: "/music/night-run.wav",
  storagePath: "/storage/night-run.json",
  importedAt: "2026-06-20T10:00:00.000Z",
  bpm: 126,
  bpmConfidence: 0.9,
  durationSeconds: 240,
  waveformBins: [0.2, 0.4],
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
    waveformBins: [0.2, 0.4],
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

const playlist: BaseTrackPlaylist = {
  id: "playlist-1",
  name: "Warmup",
  trackIds: ["track-1"],
  createdAt: "2026-06-20T10:00:00.000Z",
  updatedAt: "2026-06-20T10:00:00.000Z",
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
  waveformBins: [0.2, 0.4],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
  notes: [],
  tags: ["logs"],
  metrics: {},
};

const composition: CompositionResultRecord = {
  id: "composition-1",
  title: "Night composition",
  sourcePath: "/compositions/night.json",
  exportPath: "/exports/night.wav",
  previewAudioPath: "/exports/night-preview.wav",
  sourceKind: "file",
  importedAt: "2026-06-20T10:00:00.000Z",
  baseAssetId: "base-1",
  baseAssetTitle: "Base groove",
  baseAssetCategoryId: "drums",
  baseAssetCategoryLabel: "Drums",
  basePlaylistId: "playlist-1",
  basePlaylistName: "Warmup",
  referenceType: "track",
  referenceAssetId: "track-1",
  referenceTitle: "Night run",
  referenceSourcePath: "/music/night-run.wav",
  targetBpm: 126,
  confidence: 0.88,
  strategy: "balanced",
  summary: "Composed preview",
  analyzerStatus: "ready",
  notes: ["layered texture"],
  tags: ["draft"],
  metrics: {
    previewDurationSeconds: 96,
  },
  waveformBins: [0.2, 0.4],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
};

function renderComposeScreen(overrides: Partial<ComponentProps<typeof ComposeScreen>> = {}) {
  const props: ComponentProps<typeof ComposeScreen> = {
    composition: null,
    compositions: [],
    baseAssets: [],
    tracks: [],
    playlists: [],
    repositories: [],
    analyzerLabel: "Maia Analyzer",
    busy: false,
    onImportComposition: vi.fn(async () => true),
    onSelectComposition: vi.fn(),
    onGoLibrary: vi.fn(),
    ...overrides,
  };

  render(
    <I18nContext.Provider value={en}>
      <ComposeScreen {...props} />
    </I18nContext.Provider>,
  );

  return props;
}

describe("ComposeScreen", () => {
  it("renders the empty requirements state and routes to library when inputs are missing", () => {
    const props = renderComposeScreen();

    fireEvent.click(screen.getByRole("button", { name: en.compose.goLibrary }));

    expect(screen.getByText(en.compose.emptyRequirements)).toBeInTheDocument();
    expect(props.onGoLibrary).toHaveBeenCalledTimes(1);
  });

  it("renders composition tabs and delegates selection/render states", () => {
    const onSelectComposition = vi.fn();

    renderComposeScreen({
      composition,
      compositions: [composition],
      baseAssets: [baseAsset],
      tracks: [track],
      playlists: [playlist],
      repositories: [repository],
      onSelectComposition,
    });

    expect(screen.getByTestId("import-composition-form")).toBeInTheDocument();
    expect(screen.getByTestId("waveform-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("bpm-curve-panel")).toBeInTheDocument();
    expect(screen.getByTestId("composition-metrics-panel")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: composition.id },
    });
    expect(onSelectComposition).toHaveBeenCalledWith(composition.id);

    fireEvent.click(screen.getByRole("button", { name: en.compose.structureTab }));
    expect(screen.getByTestId("composition-timeline-panel")).toBeInTheDocument();
    expect(screen.getByTestId("composition-overview-panel")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: en.compose.renderTab }));
    fireEvent.click(screen.getByTestId("composition-render-preview-panel"));

    fireEvent.click(screen.getByRole("button", { name: en.compose.exportTab }));
    expect(screen.getByTestId("export-composition-panel")).toBeInTheDocument();
  });
});
