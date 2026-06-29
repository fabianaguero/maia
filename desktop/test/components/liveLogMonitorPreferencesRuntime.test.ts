import { describe, expect, it } from "vitest";

import {
  buildLiveMonitorPrefsState,
  buildRepoResetMonitorState,
  resolveNextSceneBaseAssetId,
  resolveNextSceneCompositionId,
  resolveGuideTrackSeedPlaylist,
} from "../../src/features/analyzer/components/liveLogMonitorPreferencesRuntime";

describe("liveLogMonitorPreferencesRuntime", () => {
  it("seeds a base playlist from the guide track when the playlist is empty", () => {
    const playlist = resolveGuideTrackSeedPlaylist({
      currentTrackCount: 0,
      guideTrackPath: "/music/track-1.wav",
      availableTracks: [
        {
          id: "track-1",
          title: "Track 1",
          sourcePath: "/music/track-1.wav",
          storagePath: null,
          importedAt: "2026-06-26T00:00:00.000Z",
          bpm: 126,
          bpmConfidence: 0.9,
          durationSeconds: 180,
          waveformBins: [],
          beatGrid: [],
          bpmCurve: [],
          analyzerStatus: "ready",
          repoSuggestedBpm: null,
          repoSuggestedStatus: "idle",
          notes: [],
          fileExtension: "wav",
          analysisMode: "track",
          musicStyleId: "house",
          musicStyleLabel: "House",
          keySignature: null,
          energyLevel: null,
          danceability: null,
          structuralPatterns: [],
          file: {
            sourcePath: "/music/track-1.wav",
            storagePath: null,
            sourceKind: "file",
            fileExtension: "wav",
            sizeBytes: 1000,
            modifiedAt: null,
            checksum: null,
            availabilityState: "available",
            playbackSource: "source_file",
          },
          tags: {
            title: "Track 1",
            artist: null,
            album: null,
            genre: null,
            year: null,
            comment: null,
            artworkPath: null,
            musicStyleId: "house",
            musicStyleLabel: "House",
          },
          analysis: {
            importedAt: "2026-06-26T00:00:00.000Z",
            bpm: 126,
            bpmConfidence: 0.9,
            durationSeconds: 180,
            waveformBins: [],
            beatGrid: [],
            bpmCurve: [],
            analyzerStatus: "ready",
            analysisMode: "track",
            analyzerVersion: null,
            analyzedAt: null,
            repoSuggestedBpm: null,
            repoSuggestedStatus: "idle",
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
        },
      ],
    });

    expect(playlist?.trackIds).toEqual(["track-1"]);
    expect(playlist?.name).toContain("Track 1");
  });

  it("builds repo reset state from persisted prefs and preferred ids", () => {
    const state = buildRepoResetMonitorState({
      availableBaseAssets: [
        {
          id: "asset-1",
          title: "Asset 1",
          sourcePath: "/assets/one",
          storagePath: "/assets/one",
          sourceKind: "directory",
          importedAt: "2026-06-26T00:00:00.000Z",
          categoryId: "drums",
          categoryLabel: "Drums",
          reusable: true,
          entryCount: 1,
          checksum: null,
          confidence: 0.9,
          summary: "",
          analyzerStatus: "ready",
          notes: [],
          tags: [],
          metrics: {},
        },
      ],
      availableCompositions: [
        {
          id: "composition-1",
          title: "Composition 1",
          sourcePath: "/compositions/one",
          exportPath: null,
          previewAudioPath: null,
          sourceKind: "directory",
          importedAt: "2026-06-26T00:00:00.000Z",
          baseAssetId: "asset-1",
          baseAssetTitle: "Asset 1",
          baseAssetCategoryId: "drums",
          baseAssetCategoryLabel: "Drums",
          referenceType: "manual",
          referenceAssetId: null,
          referenceTitle: "Manual",
          referenceSourcePath: null,
          targetBpm: 126,
          summary: "",
          confidence: 0.9,
          strategy: "default",
          analyzerStatus: "ready",
          notes: [],
          tags: [],
          metrics: {},
          waveformBins: [],
          beatGrid: [],
          bpmCurve: [],
        },
      ],
      preferredBaseAssetIdProp: "asset-1",
      preferredCompositionIdProp: "composition-1",
      prefs: {
        basePlaylist: {
          id: "playlist-1",
          name: "Playlist 1",
          trackIds: ["track-1"],
          createdAt: "2026-06-26T00:00:00.000Z",
          updatedAt: "2026-06-26T00:00:00.000Z",
        },
        selectedStyleProfileId: "style-1",
        selectedMutationProfileId: "mutation-1",
        masterVolume: 0.61,
      },
    });

    expect(state.sceneBaseAssetId).toBe("asset-1");
    expect(state.sceneCompositionId).toBe("composition-1");
    expect(state.basePlaylist.trackIds).toEqual(["track-1"]);
    expect(state.selectedStyleProfileId).toBe("style-1");
    expect(state.selectedMutationProfileId).toBe("mutation-1");
    expect(state.masterVolume).toBe(0.61);
    expect(state.forcedLiveMutationState).toBe("auto");
  });

  it("builds persisted prefs payload from current monitor preferences", () => {
    expect(
      buildLiveMonitorPrefsState({
        basePlaylist: null,
        selectedStyleProfileId: "style-1",
        selectedMutationProfileId: "mutation-1",
        masterVolume: 0.4,
      }),
    ).toEqual({
      basePlaylist: null,
      selectedStyleProfileId: "style-1",
      selectedMutationProfileId: "mutation-1",
      masterVolume: 0.4,
    });
  });

  it("keeps valid current scene ids and falls back when they disappear", () => {
    expect(
      resolveNextSceneBaseAssetId({
        currentSceneBaseAssetId: "asset-1",
        availableBaseAssets: [
          {
            id: "asset-1",
            title: "Asset 1",
            sourcePath: "/assets/one",
            storagePath: "/assets/one",
            sourceKind: "directory",
            importedAt: "2026-06-26T00:00:00.000Z",
            categoryId: "drums",
            categoryLabel: "Drums",
            reusable: true,
            entryCount: 1,
            checksum: null,
            confidence: 0.9,
            summary: "",
            analyzerStatus: "ready",
            notes: [],
            tags: [],
            metrics: {},
          },
        ],
        preferredBaseAssetIdProp: "asset-1",
      }),
    ).toBe("asset-1");

    expect(
      resolveNextSceneCompositionId({
        currentSceneCompositionId: "missing",
        availableCompositions: [
          {
            id: "composition-1",
            title: "Composition 1",
            sourcePath: "/compositions/one",
            exportPath: null,
            previewAudioPath: null,
            sourceKind: "directory",
            importedAt: "2026-06-26T00:00:00.000Z",
            baseAssetId: "asset-1",
            baseAssetTitle: "Asset 1",
            baseAssetCategoryId: "drums",
            baseAssetCategoryLabel: "Drums",
            referenceType: "manual",
            referenceAssetId: null,
            referenceTitle: "Manual",
            referenceSourcePath: null,
            targetBpm: 126,
            summary: "",
            confidence: 0.9,
            strategy: "default",
            analyzerStatus: "ready",
            notes: [],
            tags: [],
            metrics: {},
            waveformBins: [],
            beatGrid: [],
            bpmCurve: [],
          },
        ],
        preferredCompositionIdProp: "composition-1",
      }),
    ).toBe("composition-1");
  });
});
