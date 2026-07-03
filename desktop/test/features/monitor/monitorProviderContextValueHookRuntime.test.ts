import { describe, expect, it, vi } from "vitest";

import { resolveSourceTemplate } from "../../../src/config/sourceTemplates";
import {
  buildMonitorProviderContextHookDeps,
  buildMonitorProviderContextHookValue,
} from "../../../src/features/monitor/monitorProviderContextValueHookRuntime";
import type { UseMonitorProviderContextValueInput } from "../../../src/features/monitor/useMonitorProviderContextValue";

function createInput(): UseMonitorProviderContextValueInput {
  return {
    session: {
      sessionId: "session-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "repo",
      sourcePath: "/logs/app.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: 123,
    },
    metrics: {
      windowCount: 2,
      processedLines: 40,
      totalAnomalies: 3,
    },
    isPlayback: false,
    guideTrackReady: true,
    guideTrackPath: "/tracks/a.wav",
    playbackProgress: 0.5,
    isPlaybackPaused: false,
    playbackEventIndex: 4,
    playbackEventCount: 9,
    guideTrackDurationSec: 188,
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
    audioContext: null,
    resumeAudio: vi.fn(async () => undefined),
    activeTemplate: resolveSourceTemplate("melodic-techno"),
    setActiveTemplate: vi.fn(),
    listenersRef: { current: new Set() },
    logger: { info: vi.fn() },
  };
}

describe("monitorProviderContextValueHookRuntime", () => {
  it("builds the public monitor context value without subscribe", () => {
    const input = createInput();

    expect(buildMonitorProviderContextHookValue(input)).toEqual(
      expect.objectContaining({
        session: input.session,
        metrics: input.metrics,
        activeTemplate: input.activeTemplate,
        setGuideTrack: input.setGuideTrack,
        startSession: input.startSession,
        resumeAudio: input.resumeAudio,
      }),
    );
  });

  it("builds the memo dependency list in the same public value order plus subscribe", () => {
    const input = createInput();
    const subscribe = vi.fn();
    const deps = buildMonitorProviderContextHookDeps(input, subscribe);

    expect(deps).toContain(input.session);
    expect(deps).toContain(input.metrics);
    expect(deps).toContain(subscribe);
    expect(deps.at(-1)).toBe(input.setActiveTemplate);
  });
});
