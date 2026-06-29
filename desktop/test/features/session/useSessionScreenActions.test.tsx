import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useSessionScreenActions } from "../../../src/features/session/useSessionScreenActions";

function createInput(overrides: Partial<Parameters<typeof useSessionScreenActions>[0]> = {}) {
  return {
    t: en,
    baseMode: "track" as const,
    mode: "log" as const,
    repositories: [
      {
        id: "repo-1",
        title: "production.log",
        sourcePath: "/logs/production.log",
        sourceKind: "file",
      },
    ] as never,
    sessions: [
      {
        id: "session-1",
        label: "Night watch",
        sourceId: "repo-1",
        sourceTitle: "production.log",
        sourcePath: "/logs/production.log",
        sourceKind: "file",
        trackId: "track-1",
        trackTitle: "Base Pulse",
        playlistId: null,
        playlistName: null,
        adapterKind: "file",
        mode: "live",
        status: "completed",
        fileCursor: 0,
        totalPolls: 3,
        totalLines: 42,
        totalAnomalies: 2,
        lastBpm: 126,
        createdAt: "2026-06-27T12:00:00.000Z",
        updatedAt: "2026-06-27T12:00:00.000Z",
      },
    ] as never,
    selectedPlaylistId: null,
    selectedSourceId: "repo-1",
    selectedTrackId: "track-1",
    sessionLabel: "Night watch",
    directPath: "/logs/direct.log",
    onStartSession: vi.fn(async () => true),
    onResume: vi.fn(),
    onPlayback: vi.fn(async () => true),
    onReplayBookmark: vi.fn(async () => true),
    onSelectSession: vi.fn(),
    setCreateError: vi.fn(),
    setCreating: vi.fn(),
    setIsDirectLoading: vi.fn(),
    setSessionLabel: vi.fn(),
    setSelectedSourceId: vi.fn(),
    setSelectedTrackId: vi.fn(),
    setSelectedPlaylistId: vi.fn(),
    setDirectPath: vi.fn(),
    ...overrides,
  };
}

describe("useSessionScreenActions", () => {
  it("creates a session and clears the current selections on success", async () => {
    const input = createInput();
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handleCreateSession();
    });

    expect(input.onStartSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.stringContaining("session_"),
        source: "/logs/production.log",
      }),
      expect.stringContaining("session_"),
      expect.any(Object),
    );
    expect(input.setSessionLabel).toHaveBeenCalledWith("");
    expect(input.setSelectedSourceId).toHaveBeenCalledWith(null);
    expect(input.setSelectedTrackId).toHaveBeenCalledWith(null);
    expect(input.setSelectedPlaylistId).toHaveBeenCalledWith(null);
    expect(input.setCreating).toHaveBeenCalledWith(true);
    expect(input.setCreating).toHaveBeenLastCalledWith(false);
  });

  it("plays back a stored session and selects it when the replay is valid", async () => {
    const input = createInput();
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handlePlaybackSession(input.sessions[0] as never);
    });

    expect(input.onPlayback).toHaveBeenCalledWith(input.sessions[0]);
    expect(input.onSelectSession).toHaveBeenCalledWith("session-1");
    expect(input.setCreateError).toHaveBeenCalledWith(null);
  });

  it("surfaces plan validation errors when create session inputs are incomplete", async () => {
    const input = createInput({ selectedSourceId: null });
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handleCreateSession();
    });

    expect(input.onStartSession).not.toHaveBeenCalled();
    expect(input.setCreateError).toHaveBeenLastCalledWith(en.session.selectLogSource);
    expect(input.setCreating).toHaveBeenLastCalledWith(false);
  });

  it("launches a direct session and clears the direct path on success", async () => {
    const input = createInput();
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handleDirectLaunch();
    });

    expect(input.setIsDirectLoading).toHaveBeenCalledWith(true);
    expect(input.onStartSession).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "/logs/direct.log",
      }),
      expect.stringContaining("direct_"),
      expect.any(Object),
    );
    expect(input.setDirectPath).toHaveBeenCalledWith("");
    expect(input.setIsDirectLoading).toHaveBeenLastCalledWith(false);
  });

  it("skips direct launch when the path is blank", async () => {
    const input = createInput({ directPath: "   " });
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handleDirectLaunch();
    });

    expect(input.onStartSession).not.toHaveBeenCalled();
    expect(input.setIsDirectLoading).not.toHaveBeenCalled();
  });

  it("resumes a saved session and selects it on success", async () => {
    const input = createInput();
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handleResumeSession("session-1");
    });

    expect(input.onStartSession).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "/logs/production.log",
      }),
      expect.any(String),
      expect.any(Object),
    );
    expect(input.onResume).toHaveBeenCalledWith("session-1");
    expect(input.onSelectSession).toHaveBeenCalledWith("session-1");
  });

  it("shows an error when replay playback is not available", async () => {
    const input = createInput();
    const invalidSession = {
      ...input.sessions[0],
      sourcePath: "",
    } as never;
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handlePlaybackSession(invalidSession);
    });

    expect(input.onPlayback).not.toHaveBeenCalled();
    expect(input.setCreateError).toHaveBeenLastCalledWith(en.session.noStoredSourceReplay);
  });

  it("shows an error when replay bookmark playback fails", async () => {
    const input = createInput({
      onReplayBookmark: vi.fn(async () => false),
    });
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handleReplayBookmark(input.sessions[0] as never, 7);
    });

    expect(input.onReplayBookmark).toHaveBeenCalledWith(input.sessions[0], 7);
    expect(input.setCreateError).toHaveBeenLastCalledWith(en.session.failedReplayJump);
    expect(input.onSelectSession).not.toHaveBeenCalledWith("session-1");
  });

  it("selects the session when replay bookmark playback succeeds", async () => {
    const input = createInput();
    const { result } = renderHook(() => useSessionScreenActions(input));

    await act(async () => {
      await result.current.handleReplayBookmark(input.sessions[0] as never, 3);
    });

    expect(input.onReplayBookmark).toHaveBeenCalledWith(input.sessions[0], 3);
    expect(input.onSelectSession).toHaveBeenCalledWith("session-1");
  });
});
