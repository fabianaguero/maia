import { describe, expect, it, vi } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildLiveLogMonitorHeaderProps,
  buildLiveLogMonitorSetupProps,
} from "../../src/features/analyzer/components/liveLogMonitorPanelRenderStateRuntime";

describe("liveLogMonitorPanelRenderStateRuntime", () => {
  it("builds replay-aware header props", () => {
    const headerProps = buildLiveLogMonitorHeaderProps({
      t: en,
      replayActive: true,
      activeAdapterLabel: "FILE_TAIL",
      audioStatus: "blocked",
      deckStatusLabel: "IDLE",
      audioBadgeTone: "warn",
      audioBadgeLabel: "Audio blocked",
      liveEnabled: false,
      bounceAction: null,
      onEnsureAudioReady: vi.fn(),
      onPlayTestTone: vi.fn(),
      onStop: vi.fn(),
      onBounce: vi.fn(),
    });

    expect(headerProps.subtitle).toBe(en.inspect.liveMonitorReplayCopy);
    expect(headerProps.audioBadgeTitle).toBe(en.inspect.audioEngineBlocked);
    expect(headerProps.stopLabel).toBe(en.session.exitReplay);
  });

  it("builds setup props with live toggle-aware visibility", () => {
    const setupProps = buildLiveLogMonitorSetupProps({
      t: en,
      liveEnabled: false,
      adapterKind: "file",
      adapterDescription: "Passive tail",
      adapterTarget: "/logs/orders.log",
      selectedStyleProfileId: "detroit-techno",
      selectedMutationProfileId: "balanced",
      selectedStyleProfile: {
        id: "detroit-techno",
        label: "Detroit Techno",
        description: "Mechanical pulse.",
      },
      selectedMutationProfile: {
        id: "balanced",
        label: "Balanced",
        description: "Measured reactions.",
      },
      forcedLiveMutationState: "auto",
      hasBaseListeningBed: true,
      baseTrackCount: 2,
      adapterConfigured: true,
      cueEnginePreviewLabel: "Sampler armed",
      liveMutationStateLabel: "Auto",
      error: null,
      isStarting: false,
      pendingAddTrackId: "",
      pendingLoadPlaylistId: "",
      basePlaylist: null,
      basePlaylistTrackOptions: [],
      savedPlaylistOptions: [],
      basePlaylistEditorItems: [],
      availablePlaylists: [],
      availableTracks: [],
      setBasePlaylist: vi.fn(),
      setPendingAddTrackId: vi.fn(),
      setPendingLoadPlaylistId: vi.fn(),
      setAdapterKind: vi.fn(),
      setSelectedStyleProfileId: vi.fn(),
      setSelectedMutationProfileId: vi.fn(),
      setForcedLiveMutationState: vi.fn(),
      onStart: vi.fn(),
    });

    expect(setupProps.visible).toBe(true);
    expect(setupProps.adapterTarget).toBe("/logs/orders.log");
    expect(setupProps.selectedStyleProfileId).toBe("detroit-techno");
  });
});
