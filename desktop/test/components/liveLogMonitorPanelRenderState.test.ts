import { describe, expect, it, vi } from "vitest";

import { en } from "../../src/i18n/en";
import { buildLiveLogMonitorPanelRenderState } from "../../src/features/analyzer/components/liveLogMonitorPanelRenderState";

describe("buildLiveLogMonitorPanelRenderState", () => {
  it("maps runtime state into header and setup props", () => {
    const renderState = buildLiveLogMonitorPanelRenderState({
      t: en,
      liveEnabled: false,
      replayActive: true,
      activeAdapterLabel: "FILE_TAIL",
      audioStatus: "blocked",
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
      ctaMetaLabel: "BPM 126",
      deckStatusLabel: "IDLE",
      audioBadgeTone: "warn",
      audioBadgeLabel: "Audio blocked",
      bounceAction: null,
      onEnsureAudioReady: vi.fn(),
      onPlayTestTone: vi.fn(),
      onStop: vi.fn(),
      onBounce: vi.fn(),
      onStart: vi.fn(),
      liveDeckProps: {} as never,
    });

    expect(renderState.ctaMetaLabel).toBe("BPM 126");
    expect(renderState.headerProps.subtitle).toBe(en.inspect.liveMonitorReplayCopy);
    expect(renderState.headerProps.audioBadgeTitle).toBe(en.inspect.audioEngineBlocked);
    expect(renderState.headerProps.stopLabel).toBe(en.session.exitReplay);
    expect(renderState.setupProps.visible).toBe(true);
    expect(renderState.setupProps.adapterTarget).toBe("/logs/orders.log");
  });
});
