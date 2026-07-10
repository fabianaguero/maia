import { describe, expect, it } from "vitest";

import type { PersistedSession } from "../../../src/api/sessions";
import { en } from "../../../src/i18n/en";
import { es } from "../../../src/i18n/es";
import { buildPastSessionsViewModel } from "../../../src/features/simple/pastSessionsViewModel";
import type { LibraryTrack } from "../../../src/types/library";

describe("pastSessionsViewModel", () => {
  const baseSession = {
    metricsSnapshot: null,
  } as unknown as PersistedSession;

  function createTrack(id = "track-1"): LibraryTrack {
    return {
      id,
      file: {
        sourcePath: `/music/${id}.mp3`,
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
        title: "Replay Track",
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

  it("sorts sessions and localizes labels for english", () => {
    const viewModel = buildPastSessionsViewModel({
      t: en,
      sessions: [
        {
          ...baseSession,
          id: "completed",
          label: "",
          sourceTitle: "customers-service",
          sourcePath: "/logs/customers-service.log",
          trackTitle: "",
          createdAt: "2026-01-01T08:00:00Z",
          updatedAt: "2026-01-01T09:00:00Z",
          status: "completed",
          totalAnomalies: 2,
          totalLines: 12,
        },
        {
          ...baseSession,
          id: "active",
          label: "Live API",
          sourceTitle: "api",
          sourcePath: "/logs/api.log",
          trackTitle: "Daft Punk",
          createdAt: "2026-01-01T10:00:00Z",
          updatedAt: "2026-01-01T11:00:00Z",
          status: "active",
          totalAnomalies: 0,
          totalLines: 1,
        },
      ] as PersistedSession[],
    });

    expect(viewModel.title).toBe(en.simpleMode.setup.pastSessions);
    expect(viewModel.rows.map((row) => row.id)).toEqual(["active", "completed"]);
    expect(viewModel.rows[0]).toMatchObject({
      name: "Live API",
      trackLabel: "Daft Punk",
      lineCountLabel: "1 line",
      updatedAtLabel: expect.stringContaining("Updated "),
    });
    expect(viewModel.rows[1]).toMatchObject({
      name: "customers-service",
      trackLabel: en.simpleMode.common.noTrack,
      lineCountLabel: "12 lines",
    });
  });

  it("localizes empty and fallback labels for spanish", () => {
    const emptyViewModel = buildPastSessionsViewModel({ t: es, sessions: [] });
    expect(emptyViewModel.emptyStateLabel).toBe(es.simpleMode.setup.noPreviousSessions);

    const fallbackViewModel = buildPastSessionsViewModel({
      t: es,
      sessions: [
        {
          ...baseSession,
          id: "untitled",
          label: "",
          sourceTitle: "",
          sourcePath: "/logs/visits.log",
          trackTitle: "",
          createdAt: "2026-01-01T10:00:00Z",
          updatedAt: "invalid",
          status: "paused",
          totalAnomalies: 4,
          totalLines: 0,
        },
      ] as PersistedSession[],
    });

    expect(fallbackViewModel.rows[0]).toMatchObject({
      name: es.simpleMode.common.untitledSession,
      trackLabel: es.simpleMode.common.noTrack,
      lineCountLabel: "0 líneas",
      updatedAtLabel: `Actualizado ${es.simpleMode.common.justNow}`,
    });
  });

  it("marks persisted sessions invalid when the local log file is missing", () => {
    const viewModel = buildPastSessionsViewModel({
      t: es,
      tracks: [createTrack()],
      sourceExistsByPath: { "/logs/missing.log": false },
      trackExistsById: { "track-1": true },
      sessions: [
        {
          ...baseSession,
          id: "lost-log",
          label: "Lost log",
          sourceTitle: "lost-log",
          sourcePath: "/logs/missing.log",
          trackId: "track-1",
          trackTitle: "Replay Track",
          createdAt: "2026-01-01T10:00:00Z",
          updatedAt: "2026-01-01T10:00:00Z",
          status: "stopped",
          totalAnomalies: 0,
          totalLines: 0,
        },
      ] as PersistedSession[],
    });

    expect(viewModel.rows[0]).toMatchObject({
      id: "lost-log",
      isSourceAvailable: false,
      isTrackAvailable: true,
      invalidReason: "missing-log",
      invalidReasonLabel: es.library.pastSessionMissingLog,
    });
  });

  it("marks persisted sessions invalid when the selected track file is missing", () => {
    const viewModel = buildPastSessionsViewModel({
      t: es,
      tracks: [createTrack()],
      sourceExistsByPath: { "/logs/replay.log": true },
      trackExistsById: { "track-1": false },
      sessions: [
        {
          ...baseSession,
          id: "lost-track",
          label: "Lost track",
          sourceTitle: "replay",
          sourcePath: "/logs/replay.log",
          trackId: "track-1",
          trackTitle: "Replay Track",
          createdAt: "2026-01-01T10:00:00Z",
          updatedAt: "2026-01-01T10:00:00Z",
          status: "stopped",
          totalAnomalies: 0,
          totalLines: 10,
        },
      ] as PersistedSession[],
    });

    expect(viewModel.rows[0]).toMatchObject({
      id: "lost-track",
      isSourceAvailable: true,
      isTrackAvailable: false,
      invalidReason: "missing-track",
      invalidReasonLabel: es.library.pastSessionMissingTrack,
    });
  });
});
