import { describe, expect, it, vi } from "vitest";

import type { SourceTemplate } from "../../../src/config/sourceTemplates";
import {
  seekMonitorGuideTrackState,
  setMonitorActiveTemplateState,
  setMonitorGuideTrackPlaylistState,
  setMonitorGuideTrackState,
} from "../../../src/features/monitor/monitorProviderGuideTrackRuntime";
import type { GuideTrackPCM } from "../../../src/features/monitor/monitorAudioRuntimeTypes";

function createTemplate(id: string, bpm: number): SourceTemplate {
  return {
    id,
    label: id,
    description: `${id} template`,
    bpm,
    density: 0.5,
    swing: 0,
    genre: "ambient",
    defaultInstrumentRole: "pad",
  };
}

function createGuideTrack(): GuideTrackPCM {
  return {
    sampleRate: 100,
    samples: new Float32Array(500),
  };
}

describe("monitorProviderGuideTrackRuntime", () => {
  it("sets the active source template and logs the change", () => {
    const activeTemplateRef = { current: createTemplate("initial", 120) };
    const setActiveTemplateState = vi.fn();
    const logger = { info: vi.fn() };

    const resolved = setMonitorActiveTemplateState({
      id: "techno",
      resolveSourceTemplate: (id) => createTemplate(id, 128),
      activeTemplateRef,
      setActiveTemplateState,
      logger,
    });

    expect(resolved.bpm).toBe(128);
    expect(activeTemplateRef.current.id).toBe("techno");
    expect(setActiveTemplateState).toHaveBeenCalledWith(resolved);
    expect(logger.info).toHaveBeenCalledWith("setActiveTemplate id=%s → bpm=%d", "techno", 128);
  });

  it("seeks the guide track and clears the finished flag", () => {
    const guideTrackCursorRef = { current: { current: 0 } };
    const guideTrackFinishedRef = { current: true };
    const logger = { info: vi.fn() };

    const ok = seekMonitorGuideTrackState({
      second: 2.4,
      guideTrack: createGuideTrack(),
      guideTrackCursorRef,
      guideTrackFinishedRef,
      logger,
    });

    expect(ok).toBe(true);
    expect(guideTrackCursorRef.current.current).toBe(240);
    expect(guideTrackFinishedRef.current).toBe(false);
    expect(logger.info).toHaveBeenCalled();
  });

  it("does not seek when no decoded guide track exists", () => {
    const ok = seekMonitorGuideTrackState({
      second: 1,
      guideTrack: null,
      guideTrackCursorRef: { current: { current: 0 } },
      guideTrackFinishedRef: { current: false },
      logger: { info: vi.fn() },
    });

    expect(ok).toBe(false);
  });

  it("replaces the queue when setting a single guide track", () => {
    const guideTrackQueueRef = { current: ["a", "b"] };
    const guideTrackQueueIndexRef = { current: 3 };
    const loadGuideTrackPath = vi.fn();

    setMonitorGuideTrackState({
      path: "/tracks/one.wav",
      guideTrackQueueRef,
      guideTrackQueueIndexRef,
      loadGuideTrackPath,
    });

    expect(guideTrackQueueRef.current).toEqual(["/tracks/one.wav"]);
    expect(guideTrackQueueIndexRef.current).toBe(0);
    expect(loadGuideTrackPath).toHaveBeenCalledWith("/tracks/one.wav");
  });

  it("clears the queue when setting a null guide track", () => {
    const guideTrackQueueRef = { current: ["a", "b"] };
    const guideTrackQueueIndexRef = { current: 3 };
    const loadGuideTrackPath = vi.fn();

    setMonitorGuideTrackState({
      path: null,
      guideTrackQueueRef,
      guideTrackQueueIndexRef,
      loadGuideTrackPath,
    });

    expect(guideTrackQueueRef.current).toEqual([]);
    expect(guideTrackQueueIndexRef.current).toBe(0);
    expect(loadGuideTrackPath).toHaveBeenCalledWith(null);
  });

  it("builds playlist queues and loads the first track", () => {
    const guideTrackQueueRef = { current: [] as string[] };
    const guideTrackQueueIndexRef = { current: 1 };
    const loadGuideTrackPath = vi.fn();

    const queue = setMonitorGuideTrackPlaylistState({
      paths: ["a.wav", "b.wav"],
      buildGuideTrackQueue: (paths) => paths.map((path) => `/music/${path}`),
      guideTrackQueueRef,
      guideTrackQueueIndexRef,
      loadGuideTrackPath,
    });

    expect(queue).toEqual(["/music/a.wav", "/music/b.wav"]);
    expect(guideTrackQueueRef.current).toEqual(queue);
    expect(guideTrackQueueIndexRef.current).toBe(0);
    expect(loadGuideTrackPath).toHaveBeenCalledWith("/music/a.wav");
  });

  it("loads null when the built playlist queue is empty", () => {
    const guideTrackQueueRef = { current: ["stale.wav"] };
    const guideTrackQueueIndexRef = { current: 2 };
    const loadGuideTrackPath = vi.fn();

    const queue = setMonitorGuideTrackPlaylistState({
      paths: ["stale.wav"],
      buildGuideTrackQueue: () => [],
      guideTrackQueueRef,
      guideTrackQueueIndexRef,
      loadGuideTrackPath,
    });

    expect(queue).toEqual([]);
    expect(guideTrackQueueRef.current).toEqual([]);
    expect(guideTrackQueueIndexRef.current).toBe(0);
    expect(loadGuideTrackPath).toHaveBeenCalledWith(null);
  });
});
