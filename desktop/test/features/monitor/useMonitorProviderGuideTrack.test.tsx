import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadMonitorProviderGuideTrackPath: vi.fn(),
  reloadPendingMonitorProviderGuideTrack: vi.fn(),
  seekMonitorProviderGuideTrack: vi.fn(),
  setMonitorProviderActiveTemplate: vi.fn(),
  setMonitorProviderGuideTrack: vi.fn(),
  setMonitorProviderGuideTrackPlaylist: vi.fn(),
}));

vi.mock("../../../src/features/monitor/monitorProviderGuideTrackHookRuntime", async () => {
  const actual = await vi.importActual<
    typeof import("../../../src/features/monitor/monitorProviderGuideTrackHookRuntime")
  >("../../../src/features/monitor/monitorProviderGuideTrackHookRuntime");
  return {
    ...actual,
    loadMonitorProviderGuideTrackPath: (...args: unknown[]) =>
      mocks.loadMonitorProviderGuideTrackPath(...args),
    reloadPendingMonitorProviderGuideTrack: (...args: unknown[]) =>
      mocks.reloadPendingMonitorProviderGuideTrack(...args),
    seekMonitorProviderGuideTrack: (...args: unknown[]) =>
      mocks.seekMonitorProviderGuideTrack(...args),
    setMonitorProviderActiveTemplate: (...args: unknown[]) =>
      mocks.setMonitorProviderActiveTemplate(...args),
    setMonitorProviderGuideTrack: (...args: unknown[]) =>
      mocks.setMonitorProviderGuideTrack(...args),
    setMonitorProviderGuideTrackPlaylist: (...args: unknown[]) =>
      mocks.setMonitorProviderGuideTrackPlaylist(...args),
  };
});

import { useMonitorProviderGuideTrack } from "../../../src/features/monitor/useMonitorProviderGuideTrack";

function createInput() {
  return {
    resolveSourceTemplate: vi.fn((id: string) => ({ id, label: id })),
    decodedAudioCache: new Map<
      string,
      Promise<{ samples: Float32Array; sampleRate: number; durationSec: number }>
    >(),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      error: vi.fn(),
    },
    audioContextRef: { current: null },
    currentSegmentRef: { current: null },
    guideTrackPathRef: { current: null as string | null },
    guideTrackQueueRef: { current: [] as string[] },
    guideTrackQueueIndexRef: { current: 0 },
    guideTrackRef: { current: null },
    guideTrackCursorRef: { current: { current: 0 } },
    guideTrackFinishedRef: { current: false },
    guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
    activeTemplateRef: { current: { id: "ambient", label: "ambient" } },
    setGuideTrackReady: vi.fn(),
    setGuideTrackPathState: vi.fn(),
    setGuideTrackDurationSec: vi.fn(),
    setActiveTemplateState: vi.fn(),
  };
}

describe("useMonitorProviderGuideTrack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates all guide-track actions through the hook runtime", () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderGuideTrack(input));

    result.current.setActiveTemplate("tech-house");
    expect(mocks.setMonitorProviderActiveTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tech-house",
        resolveSourceTemplate: input.resolveSourceTemplate,
        activeTemplateRef: input.activeTemplateRef,
      }),
    );

    result.current.seekGuideTrack(12.5);
    expect(mocks.seekMonitorProviderGuideTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        second: 12.5,
        guideTrackRef: input.guideTrackRef,
        guideTrackCursorRef: input.guideTrackCursorRef,
      }),
    );

    result.current.loadGuideTrackPath("/tracks/a.wav");
    expect(mocks.loadMonitorProviderGuideTrackPath).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/tracks/a.wav",
        guideTrackPathRef: input.guideTrackPathRef,
        decodedAudioCache: input.decodedAudioCache,
      }),
    );

    result.current.setGuideTrack("/tracks/b.wav");
    expect(mocks.setMonitorProviderGuideTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/tracks/b.wav",
        guideTrackQueueRef: input.guideTrackQueueRef,
        loadGuideTrackPath: expect.any(Function),
      }),
    );

    result.current.setGuideTrackPlaylist(["a.wav", "b.wav"]);
    expect(mocks.setMonitorProviderGuideTrackPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        paths: ["a.wav", "b.wav"],
        guideTrackQueueRef: input.guideTrackQueueRef,
        loadGuideTrackPath: expect.any(Function),
      }),
    );

    const reload = result.current.buildReloadPendingGuideTrack("session-start");
    reload();
    expect(mocks.reloadPendingMonitorProviderGuideTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "session-start",
        guideTrackQueueRef: input.guideTrackQueueRef,
        guideTrackPathRef: input.guideTrackPathRef,
        loadGuideTrackPath: expect.any(Function),
      }),
    );
  });
});
