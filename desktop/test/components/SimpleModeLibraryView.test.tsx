import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { SimpleModeLibraryView } from "../../src/features/simple/SimpleModeLibraryView";
import type {
  BaseAssetRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../src/types/library";

const state = vi.hoisted(() => ({
  adapter: {
    repositories: [] as RepositoryAnalysis[],
    baseAssets: [] as BaseAssetRecord[],
    selectedRepositoryId: null as string | null,
    onSelectRepository: vi.fn(),
    onStartMonitoring: vi.fn(),
  },
  resolvePreviewAudioUrl: vi.fn(async () => "blob:test-preview"),
  revokePreviewAudioUrl: vi.fn(),
  audioPlay: vi.fn(async () => undefined),
  audioPause: vi.fn(),
}));

vi.mock("../../src/features/simple/useUnifiedLibraryState", () => ({
  useUnifiedLibraryState: () => state.adapter,
}));

vi.mock("../../src/i18n/I18nContext", () => ({
  useT: () => ({
    simpleMode: {
      nav: { files: "Files" },
      library: {
        subtitle: "Subtitle",
        yourLogs: "Your logs",
        noLogsYet: "No logs yet",
        enterLogPath: "Enter log path",
        logSourceFallback: "Log source",
        importFirstLog: "Import first log",
        sourceLogFile: "Log file",
        sourceFolder: "Folder",
        sourceLiveStream: "Live stream",
        startMonitoring: "Start monitoring",
        soundPresets: "Sound presets",
        presetFallback: "Preset",
      },
      setup: {
        pausePreview: "Pause preview",
        previewTrack: "Preview track",
      },
    },
  }),
}));

vi.mock("../../src/utils/audioPreview", () => ({
  resolvePreviewAudioUrl: state.resolvePreviewAudioUrl,
  revokePreviewAudioUrl: state.revokePreviewAudioUrl,
}));

vi.mock("../../src/components/TrackWaveformMini", () => ({
  TrackWaveformMini: ({ active }: { active?: boolean }) => (
    <div>{active ? "wave-active" : "wave-idle"}</div>
  ),
}));

class MockAudio {
  volume = 1;
  preload = "none";
  currentTime = 0;
  src: string;
  private endedListener: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
  }

  play = state.audioPlay;
  pause = state.audioPause;

  addEventListener(event: string, listener: () => void) {
    if (event === "ended") {
      this.endedListener = listener;
    }
  }

  emitEnded() {
    this.endedListener?.();
  }
}

const globalWithAudio = globalThis as typeof globalThis & {
  Audio: typeof MockAudio;
};

const track: LibraryTrack = {
  id: "track-1",
  title: "Track 1",
  sourcePath: "/music/track-1.wav",
  storagePath: null,
  importedAt: "2026-06-25T10:00:00.000Z",
  bpm: 126,
  bpmConfidence: 0.8,
  durationSeconds: 180,
  waveformBins: [],
  beatGrid: [],
  bpmCurve: [],
  analyzerStatus: "ready",
  repoSuggestedBpm: null,
  repoSuggestedStatus: "idle",
  notes: [],
  fileExtension: "wav",
  analysisMode: "track",
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: null,
  energyLevel: null,
  danceability: null,
  structuralPatterns: [],
  file: {
    sourcePath: "/music/track-1.wav",
    storagePath: null,
    sourceKind: "file",
    fileExtension: "wav",
    sizeBytes: 1000,
    modifiedAt: null,
    checksum: null,
    availabilityState: "available",
    playbackSource: "source_file",
  },
  tags: {
    title: "Track 1",
    artist: null,
    album: null,
    genre: null,
    year: null,
    comment: null,
    artworkPath: null,
    musicStyleId: "house",
    musicStyleLabel: "House",
  },
  analysis: {
    importedAt: "2026-06-25T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 180,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    analysisMode: "track",
    analyzerVersion: null,
    analyzedAt: null,
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
  },
  performance: {
    color: null,
    rating: 0,
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
  title: "orders-service",
  sourcePath: "/logs/orders.log",
  storagePath: null,
  sourceKind: "file",
  importedAt: "2026-06-25T10:00:00.000Z",
  suggestedBpm: 126,
  confidence: 0.7,
  summary: "summary",
  analyzerStatus: "ready",
  buildSystem: "none",
  primaryLanguage: "log",
  javaFileCount: 0,
  testFileCount: 0,
  waveformBins: [],
  beatGrid: [],
  bpmCurve: [],
  notes: [],
  tags: [],
  metrics: {},
};

const baseAsset: BaseAssetRecord = {
  id: "base-1",
  title: "Base 1",
  sourcePath: "/base",
  storagePath: "/base",
  sourceKind: "directory",
  importedAt: "2026-06-25T10:00:00.000Z",
  categoryId: "drums",
  categoryLabel: "Drums",
  reusable: true,
  entryCount: 1,
  checksum: null,
  confidence: 0.8,
  summary: "summary",
  analyzerStatus: "ready",
  notes: [],
  tags: [],
  metrics: {},
};

describe("SimpleModeLibraryView", () => {
  const onImportRepository = vi.fn(async () => true);
  const onImportBaseAsset = vi.fn(async () => true);
  const onSelectRepository = vi.fn();
  const onSelectTrack = vi.fn();
  const onStartMonitoring = vi.fn();

  beforeEach(() => {
    globalWithAudio.Audio = MockAudio;
    state.adapter = {
      repositories: [],
      baseAssets: [],
      selectedRepositoryId: null,
      onSelectRepository: vi.fn(),
      onStartMonitoring: vi.fn(),
    };
    state.resolvePreviewAudioUrl.mockClear();
    state.revokePreviewAudioUrl.mockClear();
    state.audioPlay.mockClear();
    state.audioPause.mockClear();
    onImportRepository.mockClear();
    onImportBaseAsset.mockClear();
    onSelectRepository.mockClear();
    onSelectTrack.mockClear();
    onStartMonitoring.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("imports the first log from the empty state prompt", async () => {
    vi.stubGlobal("prompt", vi.fn(() => "/logs/orders.log"));

    render(
      <SimpleModeLibraryView
        tracks={[track]}
        repositories={[]}
        baseAssets={[]}
        selectedRepositoryId={null}
        onSelectRepository={onSelectRepository}
        onImportRepository={onImportRepository}
        onImportBaseAsset={onImportBaseAsset}
        selectedTrackId={null}
        onSelectTrack={onSelectTrack}
        onStartMonitoring={onStartMonitoring}
      />,
    );

    fireEvent.click(screen.getByText("Import first log"));

    await waitFor(() => {
      expect(onImportRepository).toHaveBeenCalledWith({
        label: "orders.log",
        sourcePath: "/logs/orders.log",
        sourceKind: "file",
      });
    });
  });

  it("selects repositories, starts monitoring and toggles track preview", async () => {
    state.adapter = {
      repositories: [repository],
      baseAssets: [baseAsset],
      selectedRepositoryId: "repo-1",
      onSelectRepository: vi.fn(),
      onStartMonitoring: vi.fn(),
    };

    render(
      <SimpleModeLibraryView
        tracks={[track]}
        repositories={[repository]}
        baseAssets={[baseAsset]}
        selectedRepositoryId="repo-1"
        onSelectRepository={onSelectRepository}
        onImportRepository={onImportRepository}
        onImportBaseAsset={onImportBaseAsset}
        selectedTrackId="track-1"
        onSelectTrack={onSelectTrack}
        onStartMonitoring={onStartMonitoring}
      />,
    );

    fireEvent.click(screen.getByText("orders-service"));
    expect(state.adapter.onSelectRepository).toHaveBeenCalledWith("repo-1");

    fireEvent.click(screen.getByText("Start monitoring"));
    expect(state.adapter.onStartMonitoring).toHaveBeenCalledWith("repo-1", "track-1");

    fireEvent.click(screen.getByText("Track 1"));
    expect(onSelectTrack).toHaveBeenCalledWith("track-1");

    fireEvent.click(screen.getByTitle("Preview track"));
    await waitFor(() => {
      expect(state.resolvePreviewAudioUrl).toHaveBeenCalledWith("/music/track-1.wav");
    });
    await waitFor(() => {
      expect(state.audioPlay).toHaveBeenCalledTimes(1);
      expect(screen.getByTitle("Pause preview")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Pause preview"));
    await waitFor(() => {
      expect(state.audioPause).toHaveBeenCalled();
      expect(state.revokePreviewAudioUrl).toHaveBeenCalledWith("blob:test-preview");
      expect(screen.getByTitle("Preview track")).toBeInTheDocument();
    });
  });
});
