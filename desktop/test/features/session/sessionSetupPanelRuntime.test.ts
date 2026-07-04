import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionCreateFooterProps,
  buildSessionSetupHeader,
  buildSessionSetupSelectionGridProps,
  buildSessionTemplatePresetStripProps,
  buildSessionWorkflowStripProps,
  resolveSessionSetupBaseReady,
} from "../../../src/features/session/sessionSetupPanelRuntime";

describe("sessionSetupPanelRuntime", () => {
  it("resolves setup header and readiness state", () => {
    const header = buildSessionSetupHeader({ t: en });

    expect(header.title).toBe(en.session.newSessionTitle);
    expect(
      resolveSessionSetupBaseReady({
        baseMode: "track",
        selectedTrackId: "track-1",
        selectedPlaylistId: null,
      }),
    ).toBe(true);
    expect(
      resolveSessionSetupBaseReady({
        baseMode: "playlist",
        selectedTrackId: null,
        selectedPlaylistId: null,
      }),
    ).toBe(false);
  });

  it("builds child props for template, workflow, selection grid and footer", () => {
    const templateProps = buildSessionTemplatePresetStripProps({
      selectedTemplateId: "deep-house",
      onTemplateSelect: vi.fn(),
    });
    const workflowProps = buildSessionWorkflowStripProps({
      baseMode: "track",
      selectedTrackId: "track-1",
      selectedPlaylistId: null,
      selectedSourceId: "repo-1",
    });
    const selectionGridProps = buildSessionSetupSelectionGridProps({
      tracks: [],
      playlists: [],
      sourceOptions: [],
      mode: "log",
      baseMode: "track",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedPlaylistId: null,
      selectedSource: null,
      selectedTrack: null,
      selectedPlaylist: null,
      selectedBaseLabel: null,
      selectedBaseDetail: null,
      onBaseModeChange: vi.fn(),
      onTrackSelect: vi.fn(),
      onPlaylistSelect: vi.fn(),
      onModeChange: vi.fn(),
      onSourceSelect: vi.fn(),
    });
    const footerProps = buildSessionCreateFooterProps({
      baseMode: "track",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedPlaylistId: null,
      selectedSourceTitle: "orders-service",
      selectedBaseLabel: "Deck A",
      sessionLabel: "Night watch",
      sessionLabelPlaceholder: "Session",
      creating: false,
      mutating: false,
      onSessionLabelChange: vi.fn(),
      onCreateSession: vi.fn(),
    });

    expect(templateProps.selectedTemplateId).toBe("deep-house");
    expect(workflowProps.baseReady).toBe(true);
    expect(workflowProps.sourceReady).toBe(true);
    expect(selectionGridProps.selectedSourceId).toBe("repo-1");
    expect(footerProps.selectedSourceTitle).toBe("orders-service");
  });
});
