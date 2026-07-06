import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  resolveSessionScreenActionError,
  runSessionCreateAction,
  runSessionDirectLaunchAction,
  runSessionResumeAction,
} from "../../../src/features/session/sessionScreenActionStartRuntime";
import type { UseSessionScreenActionsInput } from "../../../src/features/session/sessionScreenActionsTypes";

function createInput(
  overrides: Partial<UseSessionScreenActionsInput> = {},
): UseSessionScreenActionsInput {
  return {
    t: en,
    baseMode: "track",
    mode: "log",
    repositories: [
      {
        id: "repo-1",
        title: "production.log",
        sourcePath: "/logs/production.log",
        sourceKind: "file",
      } as never,
    ],
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
      } as never,
    ],
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

describe("sessionScreenActionStartRuntime", () => {
  it("normalizes thrown error messages", () => {
    expect(resolveSessionScreenActionError(new Error("boom"), "fallback")).toBe("boom");
    expect(resolveSessionScreenActionError("plain", "fallback")).toBe("fallback");
  });

  it("runs create, direct launch and resume workflows", async () => {
    const input = createInput();

    await runSessionCreateAction(input);
    await runSessionDirectLaunchAction(input);
    await runSessionResumeAction(input, "session-1");

    expect(input.onStartSession).toHaveBeenCalledTimes(3);
    expect(input.setSessionLabel).toHaveBeenCalledWith("");
    expect(input.setDirectPath).toHaveBeenCalledWith("");
    expect(input.onResume).toHaveBeenCalledWith("session-1");
    expect(input.onSelectSession).toHaveBeenCalledWith("session-1");
  });
});
