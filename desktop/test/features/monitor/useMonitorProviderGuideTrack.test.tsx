import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMonitorProviderGuideTrack } from "../../../src/features/monitor/useMonitorProviderGuideTrack";

const loadGuideTrackPathState = vi.fn();
const reloadPendingGuideTrackForMonitorState = vi.fn();
const setMonitorActiveTemplateState = vi.fn();
const seekMonitorGuideTrackState = vi.fn();
const setMonitorGuideTrackState = vi.fn();
const setMonitorGuideTrackPlaylistState = vi.fn();

vi.mock("../../../src/features/monitor/monitorStartupRuntime", () => ({
  buildGuideTrackQueue: vi.fn((paths: string[]) => paths),
  loadGuideTrackPathState: (...args: unknown[]) => loadGuideTrackPathState(...args),
  reloadPendingGuideTrackForMonitorState: (...args: unknown[]) =>
    reloadPendingGuideTrackForMonitorState(...args),
}));

vi.mock("../../../src/features/monitor/monitorProviderGuideTrackRuntime", () => ({
  setMonitorActiveTemplateState: (...args: unknown[]) => setMonitorActiveTemplateState(...args),
  seekMonitorGuideTrackState: (...args: unknown[]) => seekMonitorGuideTrackState(...args),
  setMonitorGuideTrackState: (...args: unknown[]) => setMonitorGuideTrackState(...args),
  setMonitorGuideTrackPlaylistState: (...args: unknown[]) =>
    setMonitorGuideTrackPlaylistState(...args),
}));

vi.mock("../../../src/features/monitor/monitorGuideTrackDecodeRuntime", () => ({
  decodeGuideTrackFile: vi.fn(),
  isTauriRuntime: vi.fn(() => true),
}));

vi.mock("../../../src/api/tauri", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn((path: string) => `asset://${path}`),
}));

function createInput() {
  return {
    resolveSourceTemplate: vi.fn(),
    decodedAudioCache: new Map<string, Promise<never>>(),
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    audioContextRef: { current: null },
    currentSegmentRef: { current: null },
    guideTrackPathRef: { current: null },
    guideTrackQueueRef: { current: [] as string[] },
    guideTrackQueueIndexRef: { current: 0 },
    guideTrackRef: { current: null },
    guideTrackCursorRef: { current: { current: 0 } },
    guideTrackFinishedRef: { current: false },
    guideTrackLoadPromiseRef: { current: null },
    activeTemplateRef: { current: null as never },
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

  it("delegates active-template and seek actions to the runtime", () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderGuideTrack(input));

    act(() => {
      result.current.setActiveTemplate("techno");
      result.current.seekGuideTrack(42);
    });

    expect(setMonitorActiveTemplateState).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "techno",
        logger: input.logger,
        activeTemplateRef: input.activeTemplateRef,
      }),
    );
    expect(seekMonitorGuideTrackState).toHaveBeenCalledWith(
      expect.objectContaining({
        second: 42,
        logger: input.logger,
        guideTrackCursorRef: input.guideTrackCursorRef,
      }),
    );
  });

  it("builds load/set playlist callbacks around the same guide-track loader", () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderGuideTrack(input));

    act(() => {
      result.current.loadGuideTrackPath("/tracks/a.wav");
      result.current.setGuideTrack("/tracks/b.wav");
      result.current.setGuideTrackPlaylist(["/tracks/c.wav", "/tracks/d.wav"]);
    });

    expect(loadGuideTrackPathState).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/tracks/a.wav",
        logger: input.logger,
        guideTrackPathRef: input.guideTrackPathRef,
        decodeGuideTrack: expect.any(Function),
      }),
    );
    expect(setMonitorGuideTrackState).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/tracks/b.wav",
        loadGuideTrackPath: expect.any(Function),
      }),
    );
    expect(setMonitorGuideTrackPlaylistState).toHaveBeenCalledWith(
      expect.objectContaining({
        paths: ["/tracks/c.wav", "/tracks/d.wav"],
        loadGuideTrackPath: expect.any(Function),
      }),
    );
  });

  it("creates reload handlers with session-aware logging behavior", () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderGuideTrack(input));

    act(() => {
      result.current.buildReloadPendingGuideTrack("session-start")();
      result.current.buildReloadPendingGuideTrack("attach-session")();
    });

    expect(reloadPendingGuideTrackForMonitorState).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        reason: "session-start",
        logger: input.logger,
        loadGuideTrackPath: expect.any(Function),
      }),
    );
    expect(reloadPendingGuideTrackForMonitorState).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        reason: "attach-session",
        logger: undefined,
        loadGuideTrackPath: expect.any(Function),
      }),
    );
  });
});
