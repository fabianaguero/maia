import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { useSimpleMonitorDeckLiveControllerSlices } from "../../../src/features/simple/useSimpleMonitorDeckLiveControllerSlices";
import type { ActiveMonitorSession } from "../../../src/features/monitor/monitorContextTypes";
import type { LibraryTrack } from "../../../src/types/library";

const mockedModules = vi.hoisted(() => ({
  useSimpleMonitorReactiveAudio: vi.fn(),
  useMonitorTrackAudio: vi.fn(),
  useMonitorLiveStream: vi.fn(),
}));

vi.mock("../../../src/features/simple/useSimpleMonitorReactiveAudio", () => ({
  useSimpleMonitorReactiveAudio: mockedModules.useSimpleMonitorReactiveAudio,
}));

vi.mock("../../../src/features/simple/useMonitorTrackAudio", () => ({
  useMonitorTrackAudio: mockedModules.useMonitorTrackAudio,
}));

vi.mock("../../../src/features/simple/useMonitorLiveStream", () => ({
  useMonitorLiveStream: mockedModules.useMonitorLiveStream,
}));

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Base Pulse",
    sourcePath: "/music/base.wav",
    storagePath: null,
    importedAt: "2026-06-26T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2, 0.4],
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
      sourcePath: "/music/base.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1024,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Base Pulse",
      artist: "Maia",
      album: null,
      genre: "House",
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-26T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4],
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
}

describe("useSimpleMonitorDeckLiveControllerSlices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedModules.useSimpleMonitorReactiveAudio.mockReturnValue({
      backgroundGraphRef: { current: null },
      audioContextRef: { current: null },
      deckControlsRef: { current: {} },
      ensureBackgroundGraph: vi.fn(),
      applyTrackMutation: vi.fn(),
      playTestTone: vi.fn(),
      playCueBatch: vi.fn(),
    });
    mockedModules.useMonitorTrackAudio.mockReturnValue({
      backgroundAudioRef: { current: null },
      previewTrackId: "track-1",
      toggleTrackPreview: vi.fn(),
    });
    mockedModules.useMonitorLiveStream.mockReturnValue({
      liveLines: [{ id: "line-1" }],
      logSignalBuffer: [{ val: 24, heat: 0.2 }],
      liveSuggestedBpm: 132,
      waveformAnomalies: [],
      selectedAnomalyId: "anomaly-1",
      setSelectedAnomalyId: vi.fn(),
      simulateLog: vi.fn(),
    });
  });

  it("composes refs, reactive audio, track audio and live stream slices", () => {
    const track = createTrack();
    const session: ActiveMonitorSession = {
      sessionId: "live-1",
      persistedSessionId: null,
      repoId: "repo-1",
      repoTitle: "visits-service",
      trackId: "track-1",
      trackName: "Base Pulse",
      sourcePath: "/logs/visits-service.log",
      adapterKind: "file",
      pollMode: "direct",
      startedAt: Date.now(),
    };

    const { result } = renderHook(() =>
      useSimpleMonitorDeckLiveControllerSlices({
        audioContext: null,
        isListening: true,
        deckControls: {
          waveformScale: 1.4,
          beatSnapSubdivision: 0.25,
          reactivity: 55,
          anomalyEmphasis: 70,
          idleMotion: 30,
          cueCooldownMs: 850,
          masterVolume: 0.75,
          duckingIntensity: 35,
          recoveryRelease: 45,
          alertShape: "tight",
        },
        activeTrack: track,
        deckDurationSeconds: 240,
        session,
        streamAdapterLabel: "FILE_TAIL",
        subscribe: vi.fn(() => () => undefined),
        trackWaveProgressRef: { current: 0.25 },
        setTrackWaveProgress: vi.fn(),
        setTrackElapsedSeconds: vi.fn(),
        setTrackDurationSeconds: vi.fn(),
        liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
      }),
    );

    expect(result.current.refs.activeTrackRef.current?.id).toBe("track-1");
    expect(result.current.trackAudio.previewTrackId).toBe("track-1");
    expect(result.current.liveState.liveSuggestedBpm).toBe(132);
    expect(mockedModules.useSimpleMonitorReactiveAudio).toHaveBeenCalledTimes(1);
    expect(mockedModules.useMonitorTrackAudio).toHaveBeenCalledTimes(1);
    expect(mockedModules.useMonitorLiveStream).toHaveBeenCalledTimes(1);
  });
});
