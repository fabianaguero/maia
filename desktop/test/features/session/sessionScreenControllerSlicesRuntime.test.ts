import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionScreenControllerSlicesActionsInput,
  buildSessionScreenControllerSlicesDerivedArgs,
  buildSessionScreenControllerSlicesDerivedMemoInput,
  buildSessionScreenControllerSlicesDerivedMemoDeps,
  buildSessionScreenControllerSlicesDerivedMemoResolution,
  buildSessionScreenControllerSlicesDerivedResolution,
  buildSessionScreenControllerSlicesDerivedStateInput,
  buildSessionScreenControllerSlicesEffectsInput,
  buildSessionScreenControllerSlicesResult,
  resolveSessionScreenControllerSlicesDerivedState,
  resolveSessionScreenControllerSlicesTemplateSelection,
} from "../../../src/features/session/sessionScreenControllerSlicesRuntime";

const repository = {
  id: "repo-1",
  title: "orders-service",
  sourcePath: "/logs/orders-service.log",
  sourceKind: "file",
  suggestedBpm: 126,
} as never;

const track = {
  id: "track-1",
  title: "Track One",
  tags: { title: "Track One" },
  analysis: { bpm: 126 },
  file: {
    sourcePath: "/music/track-one.wav",
    storagePath: "/music/track-one.wav",
    playbackSource: "source_file",
    availabilityState: "available",
  },
  performance: {
    rating: 0,
    color: null,
    bpmLock: false,
    gridLock: false,
    mainCueSecond: null,
    hotCues: [],
    memoryCues: [],
    savedLoops: [],
    lastPlayedAt: null,
    playCount: 0,
  },
} as never;

function createControllerInput() {
  return {
    tracks: [track],
    playlists: [],
    repositories: [repository],
    sessions: [{ id: "session-1" }],
    sessionBookmarksBySessionId: { "session-1": [] },
    selectedSessionId: "session-1",
    activeSessionId: "session-1",
    activeSessionMode: "playback" as const,
    activePlaybackProgress: 0.48,
    onStartSession: vi.fn(),
    onResume: vi.fn(),
    onPlayback: vi.fn(),
    onReplayBookmark: vi.fn(),
    onSelectSession: vi.fn(),
  } as never;
}

function createLocalState() {
  return {
    mode: "log" as const,
    baseMode: "track" as const,
    selectedSourceId: "repo-1",
    selectedTrackId: "track-1",
    selectedPlaylistId: null,
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
    selectedSessionEvents: [],
    setLatestUpdate: vi.fn(),
    setSelectedSessionEvents: vi.fn(),
    boothBedAudioRef: { current: null },
    latestUpdate: null,
  } as never;
}

describe("sessionScreenControllerSlicesRuntime", () => {
  it("builds action and effects inputs from controller/local state", () => {
    const controllerInput = createControllerInput();
    const localState = createLocalState();

    const actionsInput = buildSessionScreenControllerSlicesActionsInput({
      t: en,
      controllerInput,
      localState,
    });
    const effectsInput = buildSessionScreenControllerSlicesEffectsInput({
      monitorSnapshot: {
        monitorSessionId: "monitor-1",
        subscribeToMonitor: vi.fn(() => vi.fn()),
      },
      localState,
      derivedState: {
        selectedSessionIdForEvents: "session-1",
        activeBedUrl: "file:///bed.wav",
      },
    });

    expect(actionsInput.sessionLabel).toBe("Night watch");
    expect(actionsInput.directPath).toBe("/logs/service.log");
    expect(actionsInput.onPlayback).toBe(controllerInput.onPlayback);
    expect(effectsInput.monitorSessionId).toBe("monitor-1");
    expect(effectsInput.selectedSessionIdForEvents).toBe("session-1");
    expect(effectsInput.activeBedUrl).toBe("file:///bed.wav");
  });

  it("resolves template selection, derived state and memo deps", () => {
    const controllerInput = createControllerInput();
    const localState = createLocalState();
    const templateSelection = resolveSessionScreenControllerSlicesTemplateSelection({
      selectedTemplateId: "deep-house",
      t: en,
    });

    const derivedState = resolveSessionScreenControllerSlicesDerivedState({
      t: en,
      controllerInput,
      monitorSnapshot: {
        monitorHasSession: true,
        monitorSession: { sessionId: "monitor-1" } as never,
      },
      localState,
      selectedTemplateGenre:
        templateSelection.selectedTemplatePresentation?.genre ??
        templateSelection.selectedTemplate?.genre ??
        null,
      selectedTemplateLabel:
        templateSelection.selectedTemplatePresentation?.label ??
        templateSelection.selectedTemplate?.label ??
        null,
    });
    const derivedArgs = buildSessionScreenControllerSlicesDerivedArgs({
      t: en,
      controllerInput,
      monitorSnapshot: {
        monitorHasSession: true,
        monitorSession: { sessionId: "monitor-1" } as never,
      },
      localState,
      selectedTemplateGenre: templateSelection.selectedTemplate?.genre ?? null,
      selectedTemplateLabel: templateSelection.selectedTemplate?.label ?? null,
    });
    const derivedStateInput = buildSessionScreenControllerSlicesDerivedStateInput(derivedArgs);
    const derivedResolution = buildSessionScreenControllerSlicesDerivedResolution({
      t: en,
      controllerInput,
      monitorSnapshot: {
        monitorHasSession: true,
        monitorSession: { sessionId: "monitor-1" } as never,
      },
      localState,
      selectedTemplateGenre: templateSelection.selectedTemplate?.genre ?? null,
      selectedTemplateLabel: templateSelection.selectedTemplate?.label ?? null,
    });
    const derivedMemoInput = buildSessionScreenControllerSlicesDerivedMemoInput(derivedArgs, {
      selectedTemplatePresentationGenre:
        templateSelection.selectedTemplatePresentation?.genre ?? null,
      selectedTemplatePresentationLabel:
        templateSelection.selectedTemplatePresentation?.label ?? null,
    });
    const derivedMemoResolution = buildSessionScreenControllerSlicesDerivedMemoResolution({
      t: en,
      controllerInput,
      monitorSnapshot: {
        monitorSession: { sessionId: "monitor-1" } as never,
      },
      localState,
      selectedTemplateGenre: templateSelection.selectedTemplate?.genre ?? null,
      selectedTemplateLabel: templateSelection.selectedTemplate?.label ?? null,
      selectedTemplatePresentationGenre:
        templateSelection.selectedTemplatePresentation?.genre ?? null,
      selectedTemplatePresentationLabel:
        templateSelection.selectedTemplatePresentation?.label ?? null,
    });
    const deps = buildSessionScreenControllerSlicesDerivedMemoDeps({
      t: en,
      controllerInput,
      monitorSnapshot: {
        monitorSession: { sessionId: "monitor-1" } as never,
      },
      localState,
      selectedTemplateGenre: templateSelection.selectedTemplate?.genre ?? null,
      selectedTemplateLabel: templateSelection.selectedTemplate?.label ?? null,
      selectedTemplatePresentationGenre:
        templateSelection.selectedTemplatePresentation?.genre ?? null,
      selectedTemplatePresentationLabel:
        templateSelection.selectedTemplatePresentation?.label ?? null,
    });

    expect(templateSelection.selectedTemplate).not.toBeNull();
    expect(derivedArgs.monitorHasSession).toBe(true);
    expect(derivedArgs.mode).toBe("log");
    expect(derivedStateInput.mode).toBe("log");
    expect(derivedResolution.args.mode).toBe("log");
    expect(derivedResolution.stateInput.mode).toBe("log");
    expect(derivedResolution.derivedState.selectedSource?.id).toBe("repo-1");
    expect(derivedMemoInput.monitorSession?.sessionId).toBe("monitor-1");
    expect(derivedMemoResolution.memoInput.monitorSession?.sessionId).toBe("monitor-1");
    expect(derivedState.selectedSource?.id).toBe("repo-1");
    expect(derivedState.selectedTrack?.id).toBe("track-1");
    expect(derivedState.sessionLabelPlaceholder.length).toBeGreaterThan(0);
    expect(Array.isArray(deps)).toBe(true);
    expect(deps.length).toBe(21);
  });

  it("returns the composed slice result without reshaping it", () => {
    const result = buildSessionScreenControllerSlicesResult({
      actions: { create: true },
      selectedTemplate: { id: "deep-house" },
      selectedTemplatePresentation: { label: "Steady House" },
      derivedState: { readyToRun: true } as never,
      selectedSessionReplayFeedbackRecommendation: { summary: "Keep this groove" },
      booth: { headline: "Session live" },
    });

    expect(result.actions).toEqual({ create: true });
    expect(result.booth).toEqual({ headline: "Session live" });
    expect(result.selectedTemplatePresentation).toEqual({ label: "Steady House" });
  });
});
