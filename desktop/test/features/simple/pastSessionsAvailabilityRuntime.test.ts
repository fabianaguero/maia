import { describe, expect, it } from "vitest";

import type { PersistedSession } from "../../../src/api/sessions";
import {
  collectLocalSessionSourcePaths,
  collectReplayTrackLocalPaths,
  isLocalFilesystemPath,
} from "../../../src/features/simple/pastSessionsAvailabilityRuntime";
import type { LibraryTrack } from "../../../src/types/library";

describe("pastSessionsAvailabilityRuntime", () => {
  function createSession(input: Partial<PersistedSession>): PersistedSession {
    return {
      id: "session",
      label: "Session",
      sourceTitle: "source",
      sourcePath: "/logs/app.log",
      trackId: null,
      trackTitle: null,
      status: "completed",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      totalAnomalies: 0,
      totalLines: 0,
      metricsSnapshot: null,
      ...input,
    } as PersistedSession;
  }

  function createTrack(id: string, sourcePath: string | null): LibraryTrack {
    return {
      id,
      file: {
        sourcePath,
        storagePath: null,
        sourceKind: "file",
        fileExtension: "mp3",
        sizeBytes: 100,
        modifiedAt: null,
        checksum: null,
        availabilityState: "available",
        playbackSource: "source_file",
      },
      tags: {
        title: id,
        artist: null,
        album: null,
        genre: null,
        year: null,
        comment: null,
        artworkPath: null,
        musicStyleId: "house",
        musicStyleLabel: "House",
      },
    } as LibraryTrack;
  }

  it("detects only local filesystem paths", () => {
    expect(isLocalFilesystemPath("/logs/app.log")).toBe(true);
    expect(isLocalFilesystemPath("gcp-cloud-run://project/service")).toBe(false);
    expect(isLocalFilesystemPath("https://example.com/logs")).toBe(false);
    expect(isLocalFilesystemPath("")).toBe(false);
    expect(isLocalFilesystemPath(null)).toBe(false);
  });

  it("collects unique local session source paths", () => {
    expect(
      collectLocalSessionSourcePaths([
        createSession({ id: "a", sourcePath: "/logs/a.log" }),
        createSession({ id: "b", sourcePath: "/logs/a.log" }),
        createSession({ id: "c", sourcePath: "gcp-cloud-run://project/service" }),
        createSession({ id: "d", sourcePath: "" }),
      ]),
    ).toEqual(["/logs/a.log"]);
  });

  it("collects local playable track paths referenced by sessions", () => {
    expect(
      collectReplayTrackLocalPaths(
        [
          createSession({ id: "a", trackId: "track-a" }),
          createSession({ id: "b", trackId: "track-remote" }),
          createSession({ id: "c", trackId: "unused" }),
        ],
        [
          createTrack("track-a", "/music/a.mp3"),
          createTrack("track-remote", "https://cdn.example.com/remote.mp3"),
          createTrack("not-referenced", "/music/not-referenced.mp3"),
        ],
      ),
    ).toEqual([["track-a", "/music/a.mp3"]]);
  });
});
