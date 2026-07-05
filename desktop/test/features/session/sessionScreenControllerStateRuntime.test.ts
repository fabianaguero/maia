import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionScreenControllerStateFromSlices,
  buildSessionScreenControllerActionBindings,
  buildSessionScreenControllerDerivedBindings,
  buildSessionScreenControllerLocalBindings,
  buildSessionScreenControllerMonitorSnapshotInput,
  buildSessionScreenControllerSlicesInput,
  buildSessionScreenControllerStateInput,
  buildSessionScreenControllerStateSections,
} from "../../../src/features/session/sessionScreenControllerStateRuntime";

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

  it("keeps slices input stable and composes controller state from local and derived state", () => {
    const localState = {
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

    const monitorSnapshot = {
      monitorSession: { sessionId: "monitor-1" },
      monitorMetrics: { windowCount: 3, processedLines: 120, totalAnomalies: 4 },
      monitorSessionId: "monitor-1",
      monitorHasSession: true,
      subscribeToMonitor: vi.fn(() => vi.fn()),
      isPlaybackPaused: false,
      playbackEventIndex: 2,
      playbackEventCount: 8,
    } as never;

    const slicesInput = buildSessionScreenControllerSlicesInput({
      t: en,
      controllerInput: {
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
      },
      monitorSnapshot,
      localState,
    });
    const localBindings = buildSessionScreenControllerLocalBindings(localState);
    const actionBindings = buildSessionScreenControllerActionBindings({
      handleCreateSession: vi.fn(async () => undefined),
      handleDirectLaunch: vi.fn(async () => undefined),
      handleResumeSession: vi.fn(),
      handlePlaybackSession: vi.fn(async () => undefined),
      handleReplayBookmark: vi.fn(async () => undefined),
    });
    const derivedBindings = buildSessionScreenControllerDerivedBindings({
      derivedState: {
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
        selectedSessionSourceDetails: { label: "orders-service", path: "/logs/orders-service.log" },
      } as never,
      selectedSessionReplayFeedbackRecommendation: null,
      booth: {
        headline: "Session live",
      } as never,
    });

    const state = buildSessionScreenControllerStateInput({
      t: en,
      monitor: {
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
      },
      localState,
      derivedState: {
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
        selectedSessionSourceDetails: { label: "orders-service", path: "/logs/orders-service.log" },
      },
      actions: {
        handleCreateSession: vi.fn(async () => undefined),
        handleDirectLaunch: vi.fn(async () => undefined),
        handleResumeSession: vi.fn(),
        handlePlaybackSession: vi.fn(async () => undefined),
        handleReplayBookmark: vi.fn(async () => undefined),
      },
      selectedSessionReplayFeedbackRecommendation: null,
      booth: {
        headline: "Session live",
      } as never,
    });

    expect(slicesInput.localState).toBe(localState);
    expect(slicesInput.monitorSnapshot).toBe(monitorSnapshot);
    expect(localBindings.directPath).toBe("/logs/service.log");
    expect(actionBindings.handleCreateSession).toBeTypeOf("function");
    expect(derivedBindings.readyToRun).toBe(true);
    expect(state.mode).toBe("log");
    expect(state.selectedSource?.id).toBe("repo-1");
    expect(state.selectedBaseDetails.detail).toBe("126 BPM");
    expect(state.booth.headline).toBe("Session live");

    const stateFromSlices = buildSessionScreenControllerStateFromSlices({
      t: en,
      monitor: {
        session: null,
        metrics: { windowCount: 3, processedLines: 120, totalAnomalies: 4 },
      } as never,
      localState,
      slicesResult: {
        actions: {
          handleCreateSession: vi.fn(async () => undefined),
          handleDirectLaunch: vi.fn(async () => undefined),
          handleResumeSession: vi.fn(),
          handlePlaybackSession: vi.fn(async () => undefined),
          handleReplayBookmark: vi.fn(async () => undefined),
        },
        selectedTemplate: null,
        selectedTemplatePresentation: null,
        derivedState: {
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
        } as never,
        selectedSessionReplayFeedbackRecommendation: null,
        booth: {
          headline: "Session live",
        } as never,
      },
    });
    expect(stateFromSlices.readyToRun).toBe(true);
    expect(stateFromSlices.booth.headline).toBe("Session live");

    const sections = buildSessionScreenControllerStateSections({
      localState,
      actions: {
        handleCreateSession: vi.fn(async () => undefined),
        handleDirectLaunch: vi.fn(async () => undefined),
        handleResumeSession: vi.fn(),
        handlePlaybackSession: vi.fn(async () => undefined),
        handleReplayBookmark: vi.fn(async () => undefined),
      },
      derivedState: {
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
        selectedSessionSourceDetails: { label: "orders-service", path: "/logs/orders-service.log" },
      } as never,
      selectedSessionReplayFeedbackRecommendation: null,
      booth: {
        headline: "Session live",
      } as never,
    });
    expect(sections.localBindings.selectedSourceId).toBe("repo-1");
    expect(sections.derivedBindings.booth.headline).toBe("Session live");
  });
});
