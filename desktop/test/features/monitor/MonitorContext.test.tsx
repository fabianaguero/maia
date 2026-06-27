import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MonitorProvider, useMonitor } from "../../../src/features/monitor/MonitorContext";
import type {
  LiveLogCue,
  LiveLogMarker,
  StreamSessionPollResult,
  StreamSessionRecord,
} from "../../../src/types/monitor";
import type { RepositoryAnalysis } from "../../../src/types/library";
import type { SessionEvent } from "../../../src/api/sessions";

const repositoriesMock = vi.hoisted(() => ({
  ingestStreamChunk: vi.fn(),
  pollLogStream: vi.fn(),
  pollStreamSession: vi.fn(),
  startStreamSession: vi.fn(),
  stopStreamSession: vi.fn(),
}));

const sessionsMock = vi.hoisted(() => ({
  insertSessionEvent: vi.fn(),
  listSessionEvents: vi.fn(),
  updatePersistedSessionCursor: vi.fn(),
  updatePersistedSessionStatus: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => repositoriesMock);
vi.mock("../../../src/api/sessions", () => sessionsMock);

class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

class MockOscillatorNode extends MockAudioNode {
  frequency = { value: 0 };
  start = vi.fn();
  stop = vi.fn();
}

class MockBufferSourceNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = "suspended";
  currentTime = 0;
  sampleRate = 44100;
  destination = {};

  resume = vi.fn(async () => {
    this.state = "running";
  });

  suspend = vi.fn(async () => {
    this.state = "suspended";
  });

  close = vi.fn(async () => undefined);

  createOscillator() {
    return new MockOscillatorNode();
  }

  createGain() {
    return new MockGainNode();
  }

  createBufferSource() {
    return new MockBufferSourceNode();
  }

  decodeAudioData = vi.fn(async (_buffer: ArrayBuffer) => {
    return {
      duration: 1,
      numberOfChannels: 1,
      sampleRate: 44100,
      getChannelData: () => new Float32Array([0, 0, 0]),
    } as unknown as AudioBuffer;
  });
}

let latestMonitor: ReturnType<typeof useMonitor> | null = null;

function MonitorHarness() {
  latestMonitor = useMonitor();
  return null;
}

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-25T20:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.82,
    summary: "steady pulse",
    analyzerStatus: "ready",
    buildSystem: "none",
    primaryLanguage: "logs",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [0.2, 0.3],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

function createCue(overrides: Partial<LiveLogCue> = {}): LiveLogCue {
  return {
    id: "cue-1",
    eventIndex: 1,
    level: "warn",
    component: "queue",
    excerpt: "queue depth rising",
    noteHz: 440,
    durationMs: 120,
    gain: 0.5,
    waveform: "triangle",
    accent: "warn",
    ...overrides,
  };
}

function createMarker(overrides: Partial<LiveLogMarker> = {}): LiveLogMarker {
  return {
    eventIndex: 1,
    level: "error",
    component: "payments",
    excerpt: "HTTP 500",
    ...overrides,
  };
}

function createSessionRecord(overrides: Partial<StreamSessionRecord> = {}): StreamSessionRecord {
  return {
    sessionId: "stream-1",
    adapterKind: "file",
    source: "/logs/visits-service.log",
    label: "visits-service",
    createdAt: "2026-06-25T20:00:00.000Z",
    lastPolledAt: "2026-06-25T20:00:01.000Z",
    totalPolls: 1,
    fileCursor: 128,
    ...overrides,
  };
}

function createPollResult(
  overrides: Partial<StreamSessionPollResult> = {},
): StreamSessionPollResult {
  return {
    session: createSessionRecord(),
    hasData: true,
    summary: "tail active",
    suggestedBpm: 126,
    confidence: 0.72,
    dominantLevel: "warn",
    lineCount: 3,
    anomalyCount: 1,
    levelCounts: { warn: 2, error: 1 },
    anomalyMarkers: [createMarker()],
    topComponents: [{ component: "queue", count: 3 }],
    sonificationCues: [createCue()],
    parsedLines: ["WARN queue depth rising", "ERROR HTTP 500", "WARN retrying"],
    warnings: [],
    ...overrides,
  };
}

function createSessionEvent(
  pollIndex: number,
  overrides: Partial<SessionEvent> = {},
): SessionEvent {
  return {
    id: pollIndex + 1,
    sessionId: "persisted-1",
    pollIndex,
    capturedAt: "2026-06-25T20:00:00.000Z",
    fromOffset: pollIndex * 100,
    toOffset: pollIndex * 100 + 100,
    summary: `window-${pollIndex}`,
    suggestedBpm: 126,
    confidence: 0.8,
    dominantLevel: pollIndex % 2 === 0 ? "warn" : "info",
    lineCount: 4,
    anomalyCount: pollIndex % 2 === 0 ? 1 : 0,
    levelCountsJson: JSON.stringify({ warn: 1, info: 3 }),
    anomalyMarkersJson: JSON.stringify([createMarker({ eventIndex: pollIndex + 1 })]),
    topComponentsJson: JSON.stringify([{ component: "queue", count: 2 }]),
    sonificationCuesJson: JSON.stringify([createCue({ eventIndex: pollIndex + 1 })]),
    parsedLinesJson: JSON.stringify([`line-${pollIndex}`]),
    warningsJson: JSON.stringify([]),
    ...overrides,
  };
}

function renderProvider() {
  latestMonitor = null;
  return render(
    <MonitorProvider>
      <MonitorHarness />
    </MonitorProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  latestMonitor = null;
  vi.clearAllMocks();
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: MockAudioContext,
  });
  repositoriesMock.startStreamSession.mockResolvedValue(createSessionRecord());
  repositoriesMock.stopStreamSession.mockResolvedValue(true);
  repositoriesMock.pollStreamSession.mockResolvedValue(createPollResult());
  repositoriesMock.pollLogStream.mockResolvedValue(
    createPollResult({
      session: createSessionRecord({ fileCursor: 256 }),
    }),
  );
  repositoriesMock.ingestStreamChunk.mockResolvedValue(createPollResult());
  sessionsMock.updatePersistedSessionStatus.mockResolvedValue(undefined);
  sessionsMock.updatePersistedSessionCursor.mockResolvedValue(undefined);
  sessionsMock.insertSessionEvent.mockResolvedValue(1);
  sessionsMock.listSessionEvents.mockResolvedValue([
    createSessionEvent(0),
    createSessionEvent(1),
  ]);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MonitorProvider", () => {
  it("creates and resumes an audio context on manual resume", async () => {
    renderProvider();

    await act(async () => {
      await latestMonitor!.resumeAudio();
    });

    expect(latestMonitor!.audioContext).not.toBeNull();
    expect(latestMonitor!.audioContext?.state).toBe("running");
  });

  it("starts a live session, emits updates to subscribers and persists session telemetry", async () => {
    renderProvider();
    const listener = vi.fn();
    const unsubscribe = latestMonitor!.subscribe(listener);

    await act(async () => {
      await latestMonitor!.startSession(
        createRepository(),
        {
          sessionId: "stream-1",
          adapterKind: "file",
          source: "/logs/visits-service.log",
          trackId: "track-1",
          trackTitle: "Base Pulse",
          sourceTemplateId: "house-file-tail",
        },
        "persisted-1",
      );
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(latestMonitor!.session?.repoTitle).toBe("visits-service");
    expect(latestMonitor!.metrics.totalAnomalies).toBe(1);

    expect(repositoriesMock.startStreamSession).toHaveBeenCalledWith({
      sessionId: "stream-1",
      adapterKind: "file",
      source: "/logs/visits-service.log",
      trackId: "track-1",
      trackTitle: "Base Pulse",
      sourceTemplateId: "house-file-tail",
    });
    expect(sessionsMock.updatePersistedSessionStatus).toHaveBeenCalledWith(
      "persisted-1",
      "active",
    );
    expect(sessionsMock.updatePersistedSessionCursor).toHaveBeenCalledWith(
      "persisted-1",
      128,
      3,
      1,
      126,
    );
    expect(sessionsMock.insertSessionEvent).toHaveBeenCalledTimes(1);

    await act(async () => {
      await latestMonitor!.stopSession();
    });

    expect(sessionsMock.updatePersistedSessionStatus).toHaveBeenCalledWith(
      "persisted-1",
      "paused",
    );
    expect(repositoriesMock.stopStreamSession).toHaveBeenCalledWith("stream-1");
    expect(latestMonitor!.session).toBeNull();

    unsubscribe();
  });

  it("attaches an existing session and falls back to direct polling when native session bootstrap fails", async () => {
    renderProvider();
    repositoriesMock.startStreamSession.mockRejectedValueOnce(new Error("no native shell"));

    await act(async () => {
      await latestMonitor!.startSession(createRepository(), {
        sessionId: "direct-1",
        adapterKind: "file",
        source: "/logs/direct.log",
      });
    });

    expect(repositoriesMock.pollLogStream).toHaveBeenCalled();
    expect(latestMonitor!.session?.pollMode).toBe("direct");

    await act(async () => {
      await latestMonitor!.attachSession({
        session: createSessionRecord({
          sessionId: "attached-1",
          source: "/logs/attached.log",
        }),
        repoId: "repo-1",
        repoTitle: "attached-service",
        trackTitle: "Attached Track",
        persistedSessionId: "persisted-attach",
      });
    });

    expect(latestMonitor!.session?.sessionId).toBe("attached-1");
    expect(latestMonitor!.session?.repoTitle).toBe("attached-service");
    expect(latestMonitor!.session?.trackName).toBe("Attached Track");

    await act(async () => {
      await latestMonitor!.stopSession();
    });
  });

  it("replays stored events and supports pause, step, resume and stop without stopping the native stream", async () => {
    renderProvider();
    const listener = vi.fn();
    latestMonitor!.subscribe(listener);

    await act(async () => {
      const ok = await latestMonitor!.playbackSession({
        sessionId: "persisted-1",
        label: "Night watch",
        sourcePath: "/logs/replay.log",
        repoId: "repo-1",
      });
      expect(ok).toBe(true);
    });

    expect(listener).toHaveBeenCalled();
    expect(latestMonitor!.isPlayback).toBe(true);
    expect(latestMonitor!.playbackEventCount).toBe(2);
    expect(latestMonitor!.playbackEventIndex).toBe(1);

    act(() => {
      latestMonitor!.pausePlayback();
    });
    expect(latestMonitor!.isPlaybackPaused).toBe(true);

    act(() => {
      latestMonitor!.stepPlaybackWindow(1);
    });
    expect(latestMonitor!.playbackEventIndex).toBe(2);

    act(() => {
      latestMonitor!.resumePlayback();
    });
    expect(latestMonitor!.isPlaybackPaused).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(650);
    });

    expect(latestMonitor!.playbackProgress).not.toBeNull();

    await act(async () => {
      await latestMonitor!.stopSession();
    });

    expect(repositoriesMock.stopStreamSession).not.toHaveBeenCalledWith("playback_persisted-1");
    expect(latestMonitor!.isPlayback).toBe(false);
    expect(latestMonitor!.session).toBeNull();
  });
});
