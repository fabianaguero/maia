import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MonitorWaveformBar } from "../../src/components/MonitorWaveformBar";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { MonitorContextValue } from "../../src/features/monitor/monitorContextTypes";
import type { LibraryTrack } from "../../src/types/library";
import type { LiveLogStreamUpdate } from "../../src/types/monitor";

const useMonitorMock = vi.fn<() => MonitorContextValue>();

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => useMonitorMock(),
}));

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Deck Track",
    sourcePath: "/music/deck-track.wav",
    storagePath: null,
    importedAt: "2026-06-25T20:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.1, 0.3, 0.6, 0.2],
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
      sourcePath: "/music/deck-track.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1234,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Deck Track",
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
      importedAt: "2026-06-25T20:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.1, 0.3, 0.6, 0.2],
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

function createMonitorValue(overrides: Partial<MonitorContextValue> = {}): MonitorContextValue {
  return {
    session: {
      sessionId: "stream-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "visits-service",
      sourcePath: "/logs/visits-service.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: Date.now(),
    },
    metrics: {
      windowCount: 1,
      processedLines: 5,
      totalAnomalies: 1,
    },
    isPlayback: false,
    guideTrackReady: true,
    guideTrackPath: "/music/deck-track.wav",
    playbackProgress: null,
    isPlaybackPaused: false,
    playbackEventIndex: null,
    playbackEventCount: null,
    guideTrackDurationSec: 240,
    setGuideTrack: vi.fn(),
    setGuideTrackPlaylist: vi.fn(),
    seekGuideTrack: vi.fn(),
    startSession: vi.fn(),
    attachSession: vi.fn(),
    stopSession: vi.fn(),
    playbackSession: vi.fn(),
    seekPlaybackProgress: vi.fn(),
    seekPlaybackWindow: vi.fn(),
    pausePlayback: vi.fn(),
    resumePlayback: vi.fn(),
    stepPlaybackWindow: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
    audioContext: { state: "running" } as AudioContext,
    resumeAudio: vi.fn(async () => undefined),
    activeTemplate: {
      id: "house-template",
      label: "House",
      icon: "🎛️",
      genre: "House",
      bpm: 126,
      styleProfileId: "house",
      mutationProfileId: "balanced",
      isLiveInput: false,
      playlist: [],
    },
    setActiveTemplate: vi.fn(),
    ...overrides,
  };
}

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/visits-service.log",
    fromOffset: 0,
    toOffset: 128,
    hasData: true,
    summary: "tail active",
    suggestedBpm: 128,
    confidence: 0.82,
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCounts: { info: 1, warn: 1 },
    anomalyMarkers: [
      {
        eventIndex: 1,
        level: "warn",
        component: "visits-service",
        excerpt: "Timeout while reading upstream response",
      },
    ],
    topComponents: [{ component: "visits-service", count: 2 }],
    sonificationCues: [],
    parsedLines: ["INFO boot complete", "WARN Timeout while reading upstream response"],
    warnings: [],
    ...overrides,
  };
}

function renderBar(tracks: LibraryTrack[] = [createTrack()]) {
  return render(
    <I18nContext.Provider value={en}>
      <MonitorWaveformBar tracks={tracks} />
    </I18nContext.Provider>,
  );
}

describe("MonitorWaveformBar", () => {
  let subscribeListener: ((update: LiveLogStreamUpdate) => void) | null;
  let unsubscribeSpy: ReturnType<typeof vi.fn>;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;

  beforeEach(() => {
    subscribeListener = null;
    unsubscribeSpy = vi.fn();
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    window.requestAnimationFrame = vi.fn(() => 1);
    window.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders active session controls and lets the user change the listening bed", () => {
    const monitor = createMonitorValue({
      audioContext: { state: "suspended" } as AudioContext,
      subscribe: vi.fn((listener) => {
        subscribeListener = listener;
        return () => {
          subscribeListener = null;
        };
      }),
    });
    useMonitorMock.mockReturnValue(monitor);

    renderBar();

    expect(screen.getByText(en.simpleMode.monitor.liveSignalEngine)).toBeInTheDocument();
    expect(screen.getByText("visits-service")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enable audio/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "/music/deck-track.wav" },
    });
    expect(monitor.setGuideTrack).toHaveBeenCalledWith("/music/deck-track.wav");

    fireEvent.click(screen.getByRole("button", { name: /enable audio/i }));
    expect(monitor.resumeAudio).toHaveBeenCalledTimes(1);
  });

  it("streams HUD lines from monitor updates and shows the live template chip", () => {
    const monitor = createMonitorValue({
      subscribe: vi.fn((listener) => {
        subscribeListener = listener;
        return () => {
          subscribeListener = null;
          unsubscribeSpy();
        };
      }),
    });
    useMonitorMock.mockReturnValue(monitor);

    renderBar();

    expect(screen.getByText(en.simpleMode.monitor.waitingTelemetryStream)).toBeInTheDocument();

    act(() => {
      subscribeListener?.(createUpdate({ suggestedBpm: 138 }));
    });

    expect(screen.getByText("WARN Timeout while reading upstream response")).toBeInTheDocument();
    const chip = document.querySelector(".template-chip--active");
    expect(chip).not.toBeNull();
    expect(chip).toHaveTextContent("House · 126 BPM");
    expect(chip).toHaveTextContent("138 live");
  });

  it("renders an idle shell without session-specific controls", () => {
    useMonitorMock.mockReturnValue(
      createMonitorValue({
        session: null,
        subscribe: vi.fn(() => () => undefined),
      }),
    );

    renderBar();

    expect(screen.queryByText(en.simpleMode.monitor.liveSignalEngine)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(document.querySelector(".monitor-waveform-bar--active")).toBeNull();
  });

  it("does not duplicate HUD lines when the stream offset does not advance and unsubscribes on teardown", () => {
    const monitor = createMonitorValue({
      subscribe: vi.fn((listener) => {
        subscribeListener = listener;
        return () => {
          subscribeListener = null;
          unsubscribeSpy();
        };
      }),
    });
    useMonitorMock.mockReturnValue(monitor);

    const { unmount } = renderBar();

    act(() => {
      subscribeListener?.(createUpdate({ toOffset: 128 }));
      subscribeListener?.(createUpdate({ toOffset: 128 }));
    });

    expect(screen.getAllByText("WARN Timeout while reading upstream response")).toHaveLength(1);

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });
});
