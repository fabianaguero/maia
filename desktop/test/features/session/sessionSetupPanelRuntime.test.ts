import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildSessionSetupPanelSections } from "../../../src/features/session/sessionSetupPanelRuntime";

describe("sessionSetupPanelRuntime", () => {
  it("builds setup panel sections from one shared contract", () => {
    const sections = buildSessionSetupPanelSections({
      t: en,
      tracks: [],
      playlists: [],
      sourceOptions: [],
      mode: "log",
      baseMode: "track",
      selectedTemplateId: "deep-house",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedPlaylistId: null,
      selectedSource: { title: "customers-service" } as never,
      selectedTrack: null,
      selectedPlaylist: null,
      selectedBaseLabel: "Base Pulse",
      selectedBaseDetail: null,
      sessionLabel: "Night watch",
      sessionLabelPlaceholder: "Session",
      creating: false,
      mutating: false,
      onTemplateSelect: vi.fn(),
      onBaseModeChange: vi.fn(),
      onTrackSelect: vi.fn(),
      onPlaylistSelect: vi.fn(),
      onModeChange: vi.fn(),
      onSourceSelect: vi.fn(),
      onSessionLabelChange: vi.fn(),
      onCreateSession: vi.fn(),
    });

    expect(sections.header.title).toBe(en.session.newSessionTitle);
    expect(sections.templateStripProps.selectedTemplateId).toBe("deep-house");
    expect(sections.workflowProps.baseReady).toBe(true);
    expect(sections.selectionGridProps.selectedSourceId).toBe("repo-1");
    expect(sections.createFooterProps.selectedSourceTitle).toBe("customers-service");
  });
});
