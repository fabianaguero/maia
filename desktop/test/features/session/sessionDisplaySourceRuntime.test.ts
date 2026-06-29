import { beforeEach, describe, expect, it, vi } from "vitest";

const { convertFileSrcMock, isTauriMock } = vi.hoisted(() => ({
  convertFileSrcMock: vi.fn((path: string) => `tauri://${path}`),
  isTauriMock: vi.fn(() => false),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: convertFileSrcMock,
  isTauri: isTauriMock,
}));

import type { PersistedSession } from "../../../src/api/sessions";
import { resolveSessionBedUrl, resolveSourceDetails } from "../../../src/features/session/sessionDisplaySourceRuntime";
import type { RepositoryAnalysis } from "../../../src/types/library";

function makeSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    id: "session-1",
    label: "Session One",
    sourceId: "repo-1",
    sourceTitle: "customers-service",
    sourcePath: "/logs/customers-service.log",
    sourceKind: "file",
    trackId: null,
    trackTitle: null,
    playlistId: null,
    playlistName: null,
    adapterKind: "file",
    mode: "live",
    status: "active",
    fileCursor: 0,
    totalPolls: 0,
    totalLines: 0,
    totalAnomalies: 0,
    lastBpm: null,
    createdAt: "2026-06-29T00:00:00.000Z",
    updatedAt: "2026-06-29T00:00:00.000Z",
    sourceTemplateId: null,
    ...overrides,
  };
}

function makeRepository(overrides: Partial<RepositoryAnalysis> = {}): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "customers-service",
    sourcePath: "/logs/customers-service.log",
    sourceKind: "file",
    suggestedBpm: 126,
    confidence: 0.9,
    analyzerStatus: "ok",
    storagePath: null,
    ...overrides,
  } as RepositoryAnalysis;
}

describe("sessionDisplaySourceRuntime", () => {
  beforeEach(() => {
    convertFileSrcMock.mockClear();
    isTauriMock.mockReturnValue(false);
  });

  it("resolves source details from sourceId, sourcePath, and session fallbacks", () => {
    const byId = resolveSourceDetails(makeSession(), [makeRepository()]);
    const byPath = resolveSourceDetails(
      makeSession({ sourceId: "missing", sourcePath: "/logs/other.log" }),
      [makeRepository({ id: "repo-2", sourcePath: "/logs/other.log", title: "other-service" })],
    );
    const bySession = resolveSourceDetails(
      makeSession({ sourceId: null, sourceTitle: "raw-stream", sourcePath: "/streams/raw.log" }),
      [],
    );

    expect(resolveSourceDetails(null, [])).toEqual({ label: null, path: null });
    expect(byId).toEqual({
      label: "customers-service",
      path: "/logs/customers-service.log",
    });
    expect(byPath).toEqual({
      label: "other-service",
      path: "/logs/other.log",
    });
    expect(bySession).toEqual({
      label: "raw-stream",
      path: "/streams/raw.log",
    });
  });

  it("keeps http urls intact and only converts local paths in Tauri", () => {
    expect(resolveSessionBedUrl(null)).toBeNull();
    expect(resolveSessionBedUrl("https://cdn.example.com/bed.wav")).toBe(
      "https://cdn.example.com/bed.wav",
    );
    expect(resolveSessionBedUrl("/music/bed.wav")).toBeNull();

    isTauriMock.mockReturnValue(true);

    expect(resolveSessionBedUrl("/music/bed.wav")).toBe("tauri:///music/bed.wav");
    expect(convertFileSrcMock).toHaveBeenCalledWith("/music/bed.wav");
  });
});
