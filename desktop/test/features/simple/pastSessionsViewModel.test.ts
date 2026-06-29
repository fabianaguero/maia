import { describe, expect, it } from "vitest";

import type { PersistedSession } from "../../../src/api/sessions";
import { en } from "../../../src/i18n/en";
import { es } from "../../../src/i18n/es";
import { buildPastSessionsViewModel } from "../../../src/features/simple/pastSessionsViewModel";

describe("pastSessionsViewModel", () => {
  const baseSession = {
    metricsSnapshot: null,
  } as unknown as PersistedSession;

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
});
