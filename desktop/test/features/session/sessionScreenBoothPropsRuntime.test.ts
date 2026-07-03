import { describe, expect, it, vi } from "vitest";

import { buildSessionScreenBoothProps } from "../../../src/features/session/sessionScreenBoothPropsRuntime";

describe("sessionScreenBoothPropsRuntime", () => {
  it("builds booth props and guards replay/resume actions when no selection exists", async () => {
    const onStopSession = vi.fn(async () => undefined);
    const controller = {
      booth: {},
      playbackActive: false,
      liveMonitorActive: false,
      readyToRun: false,
      mode: "log",
      latestUpdate: null,
      monitor: {
        session: null,
        isPlaybackPaused: false,
        stepPlaybackWindow: vi.fn(),
        resumePlayback: vi.fn(),
        pausePlayback: vi.fn(),
      },
      directPath: "",
      isDirectLoading: false,
      selectedSession: null,
      creating: false,
      setDirectPath: vi.fn(),
      handleDirectLaunch: vi.fn(),
      handleResumeSession: vi.fn(async () => undefined),
      handlePlaybackSession: vi.fn(async () => undefined),
      handleCreateSession: vi.fn(),
    } as never;

    const props = buildSessionScreenBoothProps({
      mutating: false,
      onStopSession,
      controller,
    });

    await expect(props.onReplaySelected()).resolves.toBeUndefined();
    props.onResumeSelected();
    props.onStopSession();
    expect(controller.handlePlaybackSession).not.toHaveBeenCalled();
    expect(controller.handleResumeSession).not.toHaveBeenCalled();
    expect(onStopSession).toHaveBeenCalled();
  });
});
