import { describe, expect, it, vi } from "vitest";

import {
  buildSessionScreenBoothInteractions,
  buildSessionScreenPanelsInteractions,
} from "../../../src/features/session/sessionScreenInteractionRuntime";

describe("sessionScreenInteractionRuntime", () => {
  it("builds booth interactions against controller and monitor state", async () => {
    const controller = {
      monitor: {
        session: { sessionId: "monitor-1" },
        isPlaybackPaused: false,
        stepPlaybackWindow: vi.fn(),
        resumePlayback: vi.fn(),
        pausePlayback: vi.fn(),
      },
      selectedSession: { id: "session-1" },
      setDirectPath: vi.fn(),
      handleDirectLaunch: vi.fn(),
      handleResumeSession: vi.fn(),
      handlePlaybackSession: vi.fn(async () => undefined),
      handleCreateSession: vi.fn(),
    } as never;
    const onStopSession = vi.fn(async () => undefined);

    const interactions = buildSessionScreenBoothInteractions({
      controller,
      onStopSession,
    });

    expect(interactions.monitorSessionId).toBe("monitor-1");
    interactions.onResumeSelected();
    expect(controller.handleResumeSession).toHaveBeenCalledWith("session-1");
    await interactions.onReplaySelected();
    expect(controller.handlePlaybackSession).toHaveBeenCalledWith({ id: "session-1" });
    interactions.onStepPlaybackWindow(1);
    expect(controller.monitor.stepPlaybackWindow).toHaveBeenCalledWith(1);
    interactions.onToggleReplayPlayback();
    expect(controller.monitor.pausePlayback).toHaveBeenCalled();
    interactions.onStopSession();
    expect(onStopSession).toHaveBeenCalled();
  });

  it("builds panels interactions and resets source on mode change", () => {
    const onDelete = vi.fn(async (_sessionId: string) => undefined);
    const onSelectSession = vi.fn();
    const controller = {
      mode: "log",
      setSelectedTemplateId: vi.fn(),
      setBaseMode: vi.fn(),
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
      setMode: vi.fn(),
      setSelectedSourceId: vi.fn(),
      setSessionLabel: vi.fn(),
      handleCreateSession: vi.fn(),
      handleResumeSession: vi.fn(),
      handlePlaybackSession: vi.fn(),
      handleReplayBookmark: vi.fn(),
    } as never;

    const interactions = buildSessionScreenPanelsInteractions({
      controller,
      onDelete,
      onSelectSession,
    });

    interactions.onModeChange("repo");
    expect(controller.setMode).toHaveBeenCalledWith("repo");
    expect(controller.setSelectedSourceId).toHaveBeenCalledWith(null);
    interactions.onResumeSession("session-1");
    expect(controller.handleResumeSession).toHaveBeenCalledWith("session-1");
    interactions.onDeleteSession("session-1");
    expect(onDelete).toHaveBeenCalledWith("session-1");
    expect(interactions.onSelectSession).toBe(onSelectSession);
  });
});
