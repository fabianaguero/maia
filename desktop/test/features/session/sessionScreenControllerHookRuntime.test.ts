import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionScreenControllerActionsHookInput,
  buildSessionScreenControllerBoothBaseBindings,
  buildSessionScreenControllerBoothDerivedBindings,
  buildSessionScreenControllerBoothHookInput,
  buildSessionScreenControllerBoothMonitorBindings,
  buildSessionScreenControllerBoothSessionBindings,
  buildSessionScreenControllerBoothSourceBindings,
  buildSessionScreenControllerDerivedHookInput,
  buildSessionScreenControllerDerivedMemoDeps,
  buildSessionScreenControllerHookResult,
  buildSessionScreenControllerMonitorSnapshot,
  buildSessionScreenBoothViewModelInput,
  buildSessionScreenEffectsHookInput,
} from "../../../src/features/session/sessionScreenControllerHookRuntime";

describe("sessionScreenControllerHookRuntime", () => {
  it("builds a monitor snapshot for downstream session hooks", () => {
    const snapshot = buildSessionScreenControllerMonitorSnapshot({
      session: { sessionId: "monitor-1" } as never,
      metrics: {
        windowCount: 2,
        processedLines: 64,
        totalAnomalies: 5,
      },
      subscribe: vi.fn(() => () => undefined),
      isPlaybackPaused: true,
      playbackEventIndex: 4,
      playbackEventCount: 12,
    });

    expect(snapshot.monitorSessionId).toBe("monitor-1");
    expect(snapshot.monitorHasSession).toBe(true);
    expect(snapshot.monitorMetrics.totalAnomalies).toBe(5);
    expect(snapshot.isPlaybackPaused).toBe(true);
  });

  it("maps action arguments from controller and local state", () => {
    const controllerInput = {
      repositories: [{ id: "repo-1" }],
      sessions: [{ id: "session-1" }],
      onStartSession: vi.fn(),
      onResume: vi.fn(),
      onPlayback: vi.fn(),
      onReplayBookmark: vi.fn(),
      onSelectSession: vi.fn(),
    } as never;

    const actionArgs = buildSessionScreenControllerActionsHookInput({
      t: en,
      controllerInput,
      baseMode: "track",
      mode: "log",
      selectedPlaylistId: "playlist-1",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      sessionLabel: "Night watch",
      directPath: "/logs/service.log",
      setCreateError: vi.fn(),
      setCreating: vi.fn(),
      setIsDirectLoading: vi.fn(),
      setSessionLabel: vi.fn(),
      setSelectedSourceId: vi.fn(),
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
      setDirectPath: vi.fn(),
    });

    expect(actionArgs.repositories).toBe(controllerInput.repositories);
    expect(actionArgs.sessions).toBe(controllerInput.sessions);
    expect(actionArgs.sessionLabel).toBe("Night watch");
    expect(actionArgs.directPath).toBe("/logs/service.log");
  });

  it("builds derived state inputs and stable memo deps", () => {
    const controllerInput = {
      playlists: [{ id: "playlist-1" }],
      repositories: [{ id: "repo-1" }],
      selectedSessionId: "session-1",
      sessionBookmarksBySessionId: { "session-1": [] },
      sessions: [{ id: "session-1" }],
      tracks: [{ id: "track-1" }],
    } as never;

    const derivedInput = buildSessionScreenControllerDerivedHookInput({
      controllerInput,
      activePlaybackProgress: 0.5,
      activeSessionId: "session-1",
      activeSessionMode: "playback",
      baseMode: "track",
      mode: "log",
      monitorHasSession: true,
      selectedPlaylistId: "playlist-1",
      selectedSessionEvents: [],
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      sessionPlaceholderFallback: "Session",
      templateGenre: "House",
      templateLabel: "Night Ops",
    });
    const deps = buildSessionScreenControllerDerivedMemoDeps({
      controllerInput,
      activePlaybackProgress: 0.5,
      activeSessionId: "session-1",
      activeSessionMode: "playback",
      baseMode: "track",
      mode: "log",
      monitorSession: { sessionId: "monitor-1" } as never,
      selectedPlaylistId: "playlist-1",
      selectedSessionEvents: [],
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      sessionPlaceholderFallback: "Session",
      selectedTemplateGenre: "House",
      selectedTemplateLabel: "Night Ops",
      selectedTemplatePresentationGenre: "House",
      selectedTemplatePresentationLabel: "Night Ops",
    });

    expect(derivedInput.controllerInput).toBe(controllerInput);
    expect(derivedInput.monitorHasSession).toBe(true);
    expect(derivedInput.templateLabel).toBe("Night Ops");
    expect(deps).toHaveLength(21);
    expect(deps.at(-1)).toBe("Session");
  });

  it("builds the effects hook input without reshaping values", () => {
    const input = buildSessionScreenEffectsHookInput({
      monitorSessionId: "monitor-1",
      subscribeToMonitor: vi.fn(() => () => undefined),
      setLatestUpdate: vi.fn(),
      selectedSessionIdForEvents: "session-1",
      setSelectedSessionEvents: vi.fn(),
      activeBedUrl: "file:///bed.wav",
      boothBedAudioRef: { current: null },
    });

    expect(input.monitorSessionId).toBe("monitor-1");
    expect(input.selectedSessionIdForEvents).toBe("session-1");
    expect(input.activeBedUrl).toBe("file:///bed.wav");
  });

  it("builds booth input from derived state and monitor snapshot", () => {
    const monitorSnapshot = buildSessionScreenControllerMonitorSnapshot({
      session: { sessionId: "monitor-1" } as never,
      metrics: {
        windowCount: 2,
        processedLines: 64,
        totalAnomalies: 5,
      },
      subscribe: vi.fn(() => () => undefined),
      isPlaybackPaused: false,
      playbackEventIndex: 3,
      playbackEventCount: 12,
    });
    const boothArgs = buildSessionScreenControllerBoothHookInput({
      t: en,
      mode: "log",
      latestUpdate: null,
      derivedState: {
        playbackActive: true,
        liveMonitorActive: false,
        readyToRun: true,
        playbackPercent: 50,
        activeSession: null,
        selectedSource: {
          title: "customers-service",
          sourcePath: "/logs/customers-service.log",
          suggestedBpm: 124,
        },
        selectedBaseDetails: { label: "Night Ops", detail: "2 tracks · median 125 BPM" },
        selectedSessionBaseDetails: { label: null, detail: null },
        activeBaseDetails: { label: null, detail: null },
        activeSourceDetails: { label: null, path: null },
        selectedSessionSourceDetails: { label: null, path: null },
      } as never,
      monitorSnapshot,
    });
    const derivedBindings = buildSessionScreenControllerBoothDerivedBindings({
      playbackActive: true,
      liveMonitorActive: false,
      readyToRun: true,
      playbackPercent: 50,
      activeSession: null,
      selectedSource: {
        title: "customers-service",
        sourcePath: "/logs/customers-service.log",
        suggestedBpm: 124,
      },
      selectedBaseDetails: { label: "Night Ops", detail: "2 tracks · median 125 BPM" },
      selectedSessionBaseDetails: { label: null, detail: null },
      activeBaseDetails: { label: null, detail: null },
      activeSourceDetails: { label: null, path: null },
      selectedSessionSourceDetails: { label: null, path: null },
    } as never);
    const sessionBindings = buildSessionScreenControllerBoothSessionBindings({
      playbackActive: true,
      liveMonitorActive: false,
      readyToRun: true,
      playbackPercent: 50,
      activeSession: null,
      selectedSource: {
        title: "customers-service",
        sourcePath: "/logs/customers-service.log",
        suggestedBpm: 124,
      },
      selectedBaseDetails: { label: "Night Ops", detail: "2 tracks · median 125 BPM" },
      selectedSessionBaseDetails: { label: null, detail: null },
      activeBaseDetails: { label: null, detail: null },
      activeSourceDetails: { label: null, path: null },
      selectedSessionSourceDetails: { label: null, path: null },
    } as never);
    const sourceBindings = buildSessionScreenControllerBoothSourceBindings({
      playbackActive: true,
      liveMonitorActive: false,
      readyToRun: true,
      playbackPercent: 50,
      activeSession: null,
      selectedSource: {
        title: "customers-service",
        sourcePath: "/logs/customers-service.log",
        suggestedBpm: 124,
      },
      selectedBaseDetails: { label: "Night Ops", detail: "2 tracks · median 125 BPM" },
      selectedSessionBaseDetails: { label: null, detail: null },
      activeBaseDetails: { label: null, detail: null },
      activeSourceDetails: { label: null, path: null },
      selectedSessionSourceDetails: { label: null, path: null },
    } as never);
    const baseBindings = buildSessionScreenControllerBoothBaseBindings({
      playbackActive: true,
      liveMonitorActive: false,
      readyToRun: true,
      playbackPercent: 50,
      activeSession: null,
      selectedSource: {
        title: "customers-service",
        sourcePath: "/logs/customers-service.log",
        suggestedBpm: 124,
      },
      selectedBaseDetails: { label: "Night Ops", detail: "2 tracks · median 125 BPM" },
      selectedSessionBaseDetails: { label: null, detail: null },
      activeBaseDetails: { label: null, detail: null },
      activeSourceDetails: { label: null, path: null },
      selectedSessionSourceDetails: { label: null, path: null },
    } as never);
    const monitorBindings = buildSessionScreenControllerBoothMonitorBindings(monitorSnapshot);
    const input = buildSessionScreenBoothViewModelInput(boothArgs);
    const result = buildSessionScreenControllerHookResult({
      booth: input,
    });

    expect(derivedBindings.selectedSourceTitle).toBe("customers-service");
    expect(sessionBindings.playbackPercent).toBe(50);
    expect(sourceBindings.selectedSourceSuggestedBpm).toBe(124);
    expect(baseBindings.selectedBaseLabel).toBe("Night Ops");
    expect(monitorBindings.playbackEventCount).toBe(12);
    expect(input.selectedSourceTitle).toBe("customers-service");
    expect(input.monitorMetrics.totalAnomalies).toBe(5);
    expect(input.playbackEventCount).toBe(12);
    expect(result.booth).toBe(input);
  });

  it("builds the booth view-model input without mutating the payload", () => {
    const input = buildSessionScreenBoothViewModelInput({
      t: en,
      mode: "log",
      latestUpdate: null,
      playbackActive: false,
      liveMonitorActive: false,
      readyToRun: true,
      playbackPercent: null,
      activeSession: null,
      selectedSourceTitle: "customers-service",
      selectedSourcePath: "/logs/customers-service.log",
      selectedSourceSuggestedBpm: 124,
      selectedSessionSourceLabel: null,
      selectedSessionSourcePath: null,
      selectedBaseLabel: "Night Ops",
      selectedBaseDetail: "2 tracks · median 125 BPM",
      selectedSessionBaseLabel: null,
      selectedSessionBaseDetail: null,
      activeBaseLabel: null,
      activeBaseDetail: null,
      activeSourceLabel: null,
      activeSourcePath: null,
      monitorSession: null,
      monitorMetrics: {
        windowCount: 0,
        processedLines: 0,
        totalAnomalies: 0,
      },
      isPlaybackPaused: false,
      playbackEventIndex: null,
      playbackEventCount: null,
    });

    expect(input.mode).toBe("log");
    expect(input.selectedSourceTitle).toBe("customers-service");
    expect(input.selectedBaseDetail).toContain("median 125 BPM");
  });
});
