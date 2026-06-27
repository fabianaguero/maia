import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SimpleMonitorScreen } from "../../src/features/simple/SimpleMonitorScreen";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../../src/features/monitor/monitorContextTypes";
import type { PersistedSession } from "../../src/api/sessions";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../src/features/simple/monitorSetupPreferences";
import type { LibraryTrack, RepositoryAnalysis } from "../../src/types/library";

afterEach(() => {
  cleanup();
});

const metrics: MonitorMetrics = {
  windowCount: 0,
  processedLines: 0,
  totalAnomalies: 0,
};

const repository: RepositoryAnalysis = {
  id: "repo-1",
  title: "visits-service",
  sourcePath: "/tmp/visits-service.log",
  analyzerStatus: "ready",
  importedAt: new Date().toISOString(),
  lastAnalyzedAt: null,
  techStackSummary: [],
  fileCount: 0,
  totalLines: 0,
  entryPoints: [],
  dominantLanguages: [],
  suggestedMusicStyleId: null,
  suggestedMusicStyleLabel: null,
  suggestedBpm: null,
  suggestedBpmReason: null,
  notes: [],
};

const track: LibraryTrack = {
  id: "track-1",
  title: "",
  sourcePath: "/music/around-the-world.mp3",
  storagePath: null,
  importedAt: new Date().toISOString(),
  bpm: 126,
  bpmConfidence: 0.9,
  durationSeconds: 320,
  waveformBins: new Array(64).fill(0.5),
  beatGrid: [],
  bpmCurve: [],
  analyzerStatus: "ready",
  repoSuggestedBpm: null,
  repoSuggestedStatus: "none",
  notes: [],
  fileExtension: "mp3",
  analysisMode: "full",
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: null,
  energyLevel: 0.6,
  danceability: 0.8,
  structuralPatterns: [],
  file: {
    sourcePath: "/music/around-the-world.mp3",
    storagePath: null,
    sourceKind: "file",
    fileExtension: "mp3",
    sizeBytes: null,
    modifiedAt: null,
    checksum: null,
    availabilityState: "available",
    playbackSource: "source_file",
  },
  tags: {
    title: "",
    artist: "Daft Punk",
    album: null,
    genre: "House",
    year: null,
    comment: null,
    artworkPath: null,
    musicStyleId: "house",
    musicStyleLabel: "House",
  },
  analysis: {
    importedAt: new Date().toISOString(),
    bpm: 126,
    bpmConfidence: 0.9,
    durationSeconds: 320,
    waveformBins: new Array(64).fill(0.5),
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    analysisMode: "full",
    analyzerVersion: null,
    analyzedAt: null,
    repoSuggestedBpm: null,
    repoSuggestedStatus: "none",
    notes: [],
    keySignature: null,
    energyLevel: 0.6,
    danceability: 0.8,
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

const activeSession: ActiveMonitorSession = {
  sessionId: "session-1",
  persistedSessionId: null,
  repoId: "repo-1",
  repoTitle: "visits-service",
  sourcePath: "/tmp/visits-service.log",
  startedAt: Date.now(),
  trackName: "around-the-world.mp3",
  adapterKind: "file",
  pollMode: "direct",
};

const persistedSession: PersistedSession = {
  id: "persisted-1",
  sourcePath: "/tmp/visits-service.log",
  sourceTitle: "visits-service",
  label: "visits-service",
  trackTitle: "around-the-world.mp3",
  status: "completed",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  totalLines: 320,
  totalAnomalies: 12,
};

describe("SimpleMonitorScreen", () => {
  const commonProps = {
    metrics,
    repositories: [repository],
    tracks: [track],
    onStop: vi.fn(),
    onResumeAudio: vi.fn(),
    audioStatus: "closed" as const,
    audioContext: null,
    onStartMonitoring: vi.fn(),
    onReplaySession: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    onToggleConsole: vi.fn(),
    liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
  };

  it("renders idle state without crashing when track titles are empty", () => {
    render(
      <SimpleMonitorScreen {...commonProps} session={null} pastSessions={[persistedSession]} />,
    );

    expect(screen.getByText(/Initialize passive monitoring/i)).toBeInTheDocument();
    expect(screen.getByText("Past sessions")).toBeInTheDocument();
  });

  it("renders active monitor state without crashing", () => {
    render(
      <SimpleMonitorScreen
        {...commonProps}
        session={activeSession}
        pastSessions={[persistedSession]}
        trackName="around-the-world.mp3"
        waveformBins={track.analysis.waveformBins}
      />,
    );

    expect(screen.getByText(/System active/i)).toBeInTheDocument();
    expect(screen.getByText(/HD waveform engine \/\/ scan active/i)).toBeInTheDocument();
  });
});
