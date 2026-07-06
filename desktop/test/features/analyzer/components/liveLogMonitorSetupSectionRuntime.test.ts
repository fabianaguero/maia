import { describe, expect, it, vi } from "vitest";

import {
  buildLiveLogMonitorSetupDeckViewModel,
  resolveForcedLiveMutationStateDetail,
} from "../../../../src/features/analyzer/components/liveLogMonitorSetupSectionRuntime";
import { en } from "../../../../src/i18n/en";
import type { BaseTrackPlaylist } from "../../../../src/types/library";

describe("liveLogMonitorSetupSectionRuntime", () => {
  const playlist: BaseTrackPlaylist = {
    id: "playlist-1",
    name: "Monitoring",
    trackIds: ["track-1"],
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
  };

  it("resolves forced mutation detail labels", () => {
    expect(resolveForcedLiveMutationStateDetail("auto", en)).toBe(en.inspect.liveLogDriven);
    expect(resolveForcedLiveMutationStateDetail("warning", en)).toBe(en.inspect.forcedStateWarning);
  });

  it("builds deck props for workflow, playlist editing and launch state", () => {
    const setBasePlaylist = vi.fn();
    const setPendingAddTrackId = vi.fn();
    const setPendingLoadPlaylistId = vi.fn();
    const setAdapterKind = vi.fn();
    const setSelectedStyleProfileId = vi.fn();
    const setSelectedMutationProfileId = vi.fn();
    const setForcedLiveMutationState = vi.fn();
    const onStart = vi.fn();

    const viewModel = buildLiveLogMonitorSetupDeckViewModel({
      t: en,
      adapterKind: "file",
      adapterDescription: "Passive tail",
      adapterTarget: "/logs/orders.log",
      selectedStyleProfileId: "alert-techno",
      selectedMutationProfileId: "balanced",
      selectedStyleProfile: {
        id: "alert-techno",
        label: "Alert Techno",
        description: "Mechanical pulse.",
      },
      selectedMutationProfile: {
        id: "balanced",
        label: "Balanced",
        description: "Measured reactions.",
      },
      forcedLiveMutationState: "auto",
      hasBaseListeningBed: true,
      baseTrackCount: 1,
      adapterConfigured: true,
      cueEnginePreviewLabel: "Ready",
      liveMutationStateLabel: "Auto",
      error: null,
      isStarting: false,
      pendingAddTrackId: "track-1",
      pendingLoadPlaylistId: "playlist-1",
      basePlaylist: playlist,
      basePlaylistTrackOptions: [{ id: "track-1", label: "track-1" }],
      savedPlaylistOptions: [{ id: "playlist-1", label: "Monitoring · 1 tracks" }],
      basePlaylistEditorItems: [
        {
          id: "track-1",
          label: "track-1",
          lostTitle: "Missing from disk",
          canMoveUp: false,
          canMoveDown: false,
        },
      ],
      availablePlaylists: [playlist],
      availableTracks: [],
      setBasePlaylist,
      setPendingAddTrackId,
      setPendingLoadPlaylistId,
      setAdapterKind,
      setSelectedStyleProfileId,
      setSelectedMutationProfileId,
      setForcedLiveMutationState,
      onStart,
    });

    expect(viewModel.workflowStripProps.steps).toHaveLength(4);
    expect(viewModel.basePlaylistPanelProps.playlistName).toBe("Monitoring");
    expect(viewModel.launchPanelProps.adapterDescription).toBe("Passive tail");
    expect(viewModel.launchPanelProps.forcedStateDetail).toBe(en.inspect.liveLogDriven);

    viewModel.basePlaylistPanelProps.onAddTrack();
    expect(setPendingAddTrackId).toHaveBeenCalledWith("");

    viewModel.launchPanelProps.onChangeStyleProfileId("steady-house");
    viewModel.launchPanelProps.onChangeMutationProfileId("reactive");
    viewModel.launchPanelProps.onChangeForcedState("critical");
    viewModel.launchPanelProps.onStart();

    expect(setSelectedStyleProfileId).toHaveBeenCalledWith("steady-house");
    expect(setSelectedMutationProfileId).toHaveBeenCalledWith("reactive");
    expect(setForcedLiveMutationState).toHaveBeenCalledWith("critical");
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
