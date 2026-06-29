import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSimpleMonitorScreenViewModel,
  buildSimpleMonitorDeckStateViewModel,
  coerceSimpleMonitorCollection,
  formatSimpleMonitorUptimeLabel,
  resolveSimpleMonitorActiveTrack,
  resolveSimpleMonitorDeckPresetLabel,
  resolveSimpleMonitorVisualPreset,
} from "../../../src/features/simple/simpleMonitorViewModel";
import type { ActiveMonitorSession } from "../../../src/features/monitor/MonitorContext";
import type { LibraryTrack } from "../../../src/types/library";
import type { MonitorLaunchSource } from "../../../src/features/simple/monitorSourceOptions";

function makeTrack(id: string, title: string, artist = "Maia"): LibraryTrack {
  const importedAt = "2026-06-25T12:00:00.000Z";
  return {
    id,
    title,
    sourcePath: `/music/${id}.mp3`,
    storagePath: null,
    importedAt,
    bpm: 126,
    bpmConfidence: 0.88,
    durationSeconds: 320,
    waveformBins: [0.2, 0.4],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "none",
    notes: [],
    fileExtension: ".mp3",
    analysisMode: "full",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: `/music/${id}.mp3`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: ".mp3",
      sizeBytes: null,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title,
      artist,
      album: null,
      genre: "House",
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt,
      bpm: 126,
      bpmConfidence: 0.88,
      durationSeconds: 320,
      waveformBins: [0.2, 0.4],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "full",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "none",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
  };
}

describe("simpleMonitorViewModel", () => {
  it("resolves the active track from explicit track name or session fallback", () => {
    const tracks = [makeTrack("track-1", "Around The World"), makeTrack("track-2", "Sweet Dreams")];

    expect(
      resolveSimpleMonitorActiveTrack(tracks, "track-2", undefined, undefined, undefined)?.id,
    ).toBe("track-2");
    expect(
      resolveSimpleMonitorActiveTrack(tracks, undefined, "Sweet Dreams", undefined, undefined)?.id,
    ).toBe("track-2");
    expect(
      resolveSimpleMonitorActiveTrack(tracks, undefined, undefined, "track-1", undefined)?.id,
    ).toBe("track-1");
    expect(
      resolveSimpleMonitorActiveTrack(tracks, undefined, undefined, undefined, "Around The World")
        ?.id,
    ).toBe("track-1");
    expect(
      resolveSimpleMonitorActiveTrack(tracks, undefined, undefined, undefined, undefined),
    ).toBeNull();
  });

  it("formats uptime for seconds and minute boundaries", () => {
    expect(formatSimpleMonitorUptimeLabel(12)).toBe("12s");
    expect(formatSimpleMonitorUptimeLabel(75)).toBe("1m 15s");
  });

  it("builds active monitor labels and timing", () => {
    const session: ActiveMonitorSession = {
      sessionId: "session-1",
      repoId: "repo-1",
      repoTitle: "visits-service",
      sourcePath: "/logs/visits-service.log",
      startedAt: 10_000,
      trackName: "Around The World",
      adapterKind: "file",
    };
    const launchingSource: MonitorLaunchSource = {
      id: "repo-1",
      title: "ignored-title",
      sourcePath: "/ignored",
      sourceType: "file",
      sourceTypeLabel: "Log file",
      startable: true,
      origin: "repository",
    };

    const model = buildSimpleMonitorScreenViewModel({
      session,
      launchingSource,
      isLaunchingMonitor: true,
      selectedSoundId: "track-1",
      tracks: [makeTrack("track-1", "Around The World")],
      trackName: undefined,
      t: en,
      nowMs: 85_000,
      totalAnomalies: 3,
      trackElapsedSeconds: 42,
      deckDurationSeconds: 180,
    });

    expect(model.monitorSourceTitle).toBe("visits-service");
    expect(model.monitorSourcePath).toBe("/logs/visits-service.log");
    expect(model.monitorTrackTitle).toBe("Around The World");
    expect(model.isConnectingMonitor).toBe(false);
    expect(model.uptimeLabel).toBe("1m 15s");
    expect(model.deckRemainingSeconds).toBe(138);
  });

  it("builds launch-time fallback labels without a session", () => {
    const model = buildSimpleMonitorScreenViewModel({
      session: null,
      launchingSource: null,
      isLaunchingMonitor: true,
      selectedSoundId: "",
      tracks: [],
      trackName: undefined,
      t: en,
      nowMs: 42_000,
      totalAnomalies: 0,
      trackElapsedSeconds: 12,
      deckDurationSeconds: null,
    });

    expect(model.monitorSourceTitle).toBe(en.simpleMode.setup.bootingMonitor);
    expect(model.monitorSourcePath).toBe(en.simpleMode.setup.awaitingSourceBinding);
    expect(model.monitorTrackTitle).toBe(en.simpleMode.monitor.noTrackSelected);
    expect(model.isConnectingMonitor).toBe(true);
    expect(model.uptimeLabel).toBe("0s");
    expect(model.deckRemainingSeconds).toBeNull();
  });

  it("coerces nullable monitor collections defensively", () => {
    expect(coerceSimpleMonitorCollection([1, 2, 3])).toEqual([1, 2, 3]);
    expect(coerceSimpleMonitorCollection(null)).toEqual([]);
    expect(coerceSimpleMonitorCollection(undefined)).toEqual([]);
  });

  it("resolves preset label and visual preset for custom shapes", () => {
    expect(resolveSimpleMonitorDeckPresetLabel("passive", en)).toBe(
      en.simpleMode.deckSetup.presetPassive,
    );
    expect(resolveSimpleMonitorDeckPresetLabel("balanced", en)).toBe(
      en.simpleMode.deckSetup.presetBalanced,
    );
    expect(resolveSimpleMonitorDeckPresetLabel("alert", en)).toBe(
      en.simpleMode.deckSetup.presetAlert,
    );
    expect(resolveSimpleMonitorDeckPresetLabel("custom", en)).toBe(
      en.simpleMode.deckSetup.presetCustom,
    );

    expect(
      resolveSimpleMonitorVisualPreset({
        activePreset: "custom",
        alertShape: "soft",
      }),
    ).toBe("passive");
    expect(
      resolveSimpleMonitorVisualPreset({
        activePreset: "custom",
        alertShape: "tight",
      }),
    ).toBe("balanced");
    expect(
      resolveSimpleMonitorVisualPreset({
        activePreset: "custom",
        alertShape: "aggressive",
      }),
    ).toBe("alert");
    expect(
      resolveSimpleMonitorVisualPreset({
        activePreset: "passive",
        alertShape: "aggressive",
      }),
    ).toBe("passive");
    expect(
      resolveSimpleMonitorVisualPreset({
        activePreset: "balanced",
        alertShape: "soft",
      }),
    ).toBe("balanced");
    expect(
      resolveSimpleMonitorVisualPreset({
        activePreset: "alert",
        alertShape: "soft",
      }),
    ).toBe("alert");
  });

  it("builds deck state for active track and launch state", () => {
    const track = makeTrack("track-1", "Around The World");
    const session: ActiveMonitorSession = {
      sessionId: "session-1",
      repoId: "repo-1",
      repoTitle: "visits-service",
      sourcePath: "/logs/visits-service.log",
      startedAt: 10_000,
      trackName: "Around The World",
      adapterKind: "file",
    };

    const deckState = buildSimpleMonitorDeckStateViewModel({
      session,
      isListening: true,
      isLaunchingMonitor: false,
      activeTrack: track,
      trackDurationSeconds: 240,
      activePreset: "custom",
      alertShape: "aggressive",
      t: en,
    });

    expect(deckState.deckDurationSeconds).toBe(240);
    expect(deckState.activeBeatGrid).toEqual([]);
    expect(deckState.streamAdapterLabel).toBe("FILE_TAIL");
    expect(deckState.isMonitorActive).toBe(true);
    expect(deckState.deckPresetLabel).toBe(en.simpleMode.deckSetup.presetCustom);
    expect(deckState.deckVisualPreset).toBe("alert");
  });

  it("falls back to track analysis duration and beat grid when no explicit deck duration is provided", () => {
    const track = makeTrack("track-1", "Around The World");
    track.analysis.beatGrid = [{ second: 1.5, bpm: 126, confidence: 0.9 }];

    const deckState = buildSimpleMonitorDeckStateViewModel({
      session: null,
      isListening: false,
      isLaunchingMonitor: false,
      activeTrack: track,
      trackDurationSeconds: null,
      activePreset: "balanced",
      alertShape: "soft",
      t: en,
    });

    expect(deckState.deckDurationSeconds).toBe(320);
    expect(deckState.activeBeatGrid).toEqual([{ second: 1.5, bpm: 126, confidence: 0.9 }]);
    expect(deckState.streamAdapterLabel).toBe("FILE_TAIL");
    expect(deckState.isMonitorActive).toBe(false);
    expect(deckState.deckPresetLabel).toBe(en.simpleMode.deckSetup.presetBalanced);
    expect(deckState.deckVisualPreset).toBe("balanced");
  });
});
