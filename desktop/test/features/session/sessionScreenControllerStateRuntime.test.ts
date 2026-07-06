import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionScreenControllerActionBindings,
  buildSessionScreenControllerDerivedBindings,
  buildSessionScreenControllerLocalBindings,
  buildSessionScreenControllerMonitorSnapshotInput,
  buildSessionScreenControllerSlicesInput,
  buildSessionScreenControllerStateFromSlices,
  buildSessionScreenControllerStateInput,
  buildSessionScreenControllerStateSections,
} from "../../../src/features/session/sessionScreenControllerStateRuntime";

function createLocalState() {
  return {
    mode: "log",
    setMode: vi.fn(),
    baseMode: "track",
    setBaseMode: vi.fn(),
    selectedSourceId: "repo-1",
    setSelectedSourceId: vi.fn(),
    selectedTrackId: "track-1",
    setSelectedTrackId: vi.fn(),
    selectedPlaylistId: null,
    setSelectedPlaylistId: vi.fn(),
    sessionLabel: "Night watch",
    setSessionLabel: vi.fn(),
    creating: false,
    setCreating: vi.fn(),
    createError: null,
    setCreateError: vi.fn(),
    latestUpdate: null,
    setLatestUpdate: vi.fn(),
    directPath: "/logs/service.log",
    setDirectPath: vi.fn(),
    isDirectLoading: false,
    setIsDirectLoading: vi.fn(),
    selectedTemplateId: "deep-house",
    setSelectedTemplateId: vi.fn(),
    selectedSessionEvents: [],
    setSelectedSessionEvents: vi.fn(),
    boothBedAudioRef: { current: null },
  } as never;
}

function createMonitorSnapshot() {
  return {
    monitorSession: { sessionId: "monitor-1" },
    monitorMetrics: { windowCount: 3, processedLines: 120, totalAnomalies: 4 },
    monitorSessionId: "monitor-1",
    monitorHasSession: true,
    subscribeToMonitor: vi.fn(() => vi.fn()),
    isPlaybackPaused: false,
    playbackEventIndex: 2,
    playbackEventCount: 8,
  } as never;
}

function createControllerInput() {
  return {
    tracks: [],
    playlists: [],
    repositories: [],
    sessions: [],
    sessionBookmarksBySessionId: {},
    selectedSessionId: null,
    activeSessionId: null,
    activeSessionMode: null,
    activePlaybackProgress: null,
    onStartSession: vi.fn(async () => true),
    onResume: vi.fn(),
    onPlayback: vi.fn(async () => true),
    onReplayBookmark: vi.fn(async () => true),
    onSelectSession: vi.fn(),
  };
}

function createDerivedState() {
  return {
    sourceOptions: [{ id: "repo-1" }],
    selectedSource: { id: "repo-1", title: "orders-service" },
    selectedTrack: { id: "track-1", title: "Track One" },
    selectedPlaylist: null,
    selectedBaseDetails: { label: "Deck A", detail: "126 BPM" },
    activeSession: null,
    selectedSession: null,
    selectedSessionIdForEvents: null,
    playbackActive: false,
    liveMonitorActive: true,
    activeBedUrl: null,
    selectedSessionBookmarks: [],
    bookmarkContexts: {},
    sessionLabelPlaceholder: "Session placeholder",
    playbackPercent: null,
    readyToRun: true,
    activeBaseDetails: { label: "Deck A", detail: "126 BPM" },
    selectedSessionBaseDetails: { label: "Deck A", detail: "126 BPM" },
    activeSourceDetails: { label: "orders-service", path: "/logs/orders-service.log" },
    selectedSessionSourceDetails: {
      label: "orders-service",
      path: "/logs/orders-service.log",
    },
  } as never;
}

function createActions() {
  return {
    handleCreateSession: vi.fn(async () => undefined),
    handleDirectLaunch: vi.fn(async () => undefined),
    handleResumeSession: vi.fn(),
    handlePlaybackSession: vi.fn(async () => undefined),
    handleReplayBookmark: vi.fn(async () => undefined),
  };
}

function createBooth() {
  return {
    headline: "Session live",
  } as never;
}

function createMonitor() {
  return {
    session: null,
    metrics: { windowCount: 3, processedLines: 120, totalAnomalies: 4 },
    isPlayback: false,
    guideTrackReady: false,
    guideTrackPath: null,
    playbackProgress: null,
    isPlaybackPaused: false,
    playbackEventIndex: null,
    playbackEventCount: null,
    guideTrackDurationSec: null,
    setGuideTrack: vi.fn(),
    setGuideTrackPlaylist: vi.fn(),
    seekGuideTrack: vi.fn(),
    startSession: vi.fn(async () => true),
    attachSession: vi.fn(async () => true),
    stopSession: vi.fn(async () => undefined),
    playbackSession: vi.fn(async () => true),
    seekPlaybackProgress: vi.fn(),
    seekPlaybackWindow: vi.fn(),
    pausePlayback: vi.fn(),
    resumePlayback: vi.fn(),
    stepPlaybackWindow: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    audioContext: null,
    resumeAudio: vi.fn(async () => undefined),
    activeTemplate: { id: "deep-house" } as never,
    setActiveTemplate: vi.fn(),
  } as never;
}

describe("sessionScreenControllerStateRuntime", () => {
  it("builds the monitor snapshot input from monitor context fields", () => {
    const input = buildSessionScreenControllerMonitorSnapshotInput({
      session: { sessionId: "monitor-1" } as never,
      metrics: { windowCount: 3, processedLines: 120, totalAnomalies: 4 },
      subscribe: vi.fn(() => vi.fn()),
      isPlaybackPaused: false,
      playbackEventIndex: 2,
      playbackEventCount: 8,
    });

    expect(input.session).toEqual({ sessionId: "monitor-1" });
    expect(input.metrics.totalAnomalies).toBe(4);
    expect(input.playbackEventCount).toBe(8);
  });

  it("keeps slices input stable", () => {
    const localState = createLocalState();
    const monitorSnapshot = createMonitorSnapshot();
    const controllerInput = createControllerInput();

    const slicesInput = buildSessionScreenControllerSlicesInput({
      t: en,
      controllerInput,
      monitorSnapshot,
      localState,
    });

    expect(slicesInput.t).toBe(en);
    expect(slicesInput.input).toBe(controllerInput);
    expect(slicesInput.monitorSnapshot).toBe(monitorSnapshot);
    expect(slicesInput.localState).toBe(localState);
  });

  it("builds local, action and derived bindings", () => {
    const localBindings = buildSessionScreenControllerLocalBindings(createLocalState());
    const actionBindings = buildSessionScreenControllerActionBindings(createActions());
    const derivedBindings = buildSessionScreenControllerDerivedBindings({
      derivedState: createDerivedState(),
      selectedSessionReplayFeedbackRecommendation: null,
      booth: createBooth(),
    });

    expect(localBindings.directPath).toBe("/logs/service.log");
    expect(actionBindings.handleCreateSession).toBeTypeOf("function");
    expect(derivedBindings.readyToRun).toBe(true);
    expect(derivedBindings.selectedBaseDetails.detail).toBe("126 BPM");
    expect(derivedBindings.booth.headline).toBe("Session live");
  });

  it("composes controller state sections", () => {
    const sections = buildSessionScreenControllerStateSections({
      localState: createLocalState(),
      actions: createActions(),
      derivedState: createDerivedState(),
      selectedSessionReplayFeedbackRecommendation: null,
      booth: createBooth(),
    });

    expect(sections.localBindings.selectedSourceId).toBe("repo-1");
    expect(sections.actionBindings.handlePlaybackSession).toBeTypeOf("function");
    expect(sections.derivedBindings.booth.headline).toBe("Session live");
  });

  it("merges local, action and derived sections into controller state", () => {
    const state = buildSessionScreenControllerStateInput({
      t: en,
      monitor: createMonitor(),
      localState: createLocalState(),
      derivedState: createDerivedState(),
      actions: createActions(),
      selectedSessionReplayFeedbackRecommendation: null,
      booth: createBooth(),
    });

    expect(state.mode).toBe("log");
    expect(state.selectedSource?.id).toBe("repo-1");
    expect(state.selectedBaseDetails.detail).toBe("126 BPM");
    expect(state.booth.headline).toBe("Session live");
  });

  it("builds controller state from slices output", () => {
    const state = buildSessionScreenControllerStateFromSlices({
      t: en,
      monitor: {
        session: null,
        metrics: { windowCount: 3, processedLines: 120, totalAnomalies: 4 },
      } as never,
      localState: createLocalState(),
      slicesResult: {
        actions: createActions(),
        selectedTemplate: null,
        selectedTemplatePresentation: null,
        derivedState: createDerivedState(),
        selectedSessionReplayFeedbackRecommendation: null,
        booth: createBooth(),
      },
    });

    expect(state.readyToRun).toBe(true);
    expect(state.booth.headline).toBe("Session live");
    expect(state.selectedTrack?.title).toBe("Track One");
  });
});
