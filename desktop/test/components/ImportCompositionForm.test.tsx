import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportCompositionForm } from "../../src/features/library/components/ImportCompositionForm";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ImportCompositionForm", () => {
  it("disables composition without base assets and composes from a track by default", async () => {
    const onImportComposition = vi.fn(async () => true);

    const { rerender } = renderWithI18n(
      <ImportCompositionForm
        busy={false}
        baseAssets={[]}
        tracks={[]}
        playlists={[]}
        repositories={[]}
        onImportComposition={onImportComposition}
      />,
    );

    expect(
      screen.getByRole("button", { name: en.compose.forms.createComposition }),
    ).toBeDisabled();

    rerender(
      <I18nContext.Provider value={en}>
        <ImportCompositionForm
          busy={false}
          baseAssets={[
            {
              id: "base-1",
              title: "Reactive bed",
              sourcePath: "/packs/base",
              storagePath: "/packs/base",
              sourceKind: "directory",
              importedAt: "2026-06-29",
              categoryId: "reactive",
              categoryLabel: "Reactive",
              reusable: true,
              entryCount: 16,
              checksum: null,
              confidence: 0.9,
              summary: "Summary",
              analyzerStatus: "ready",
              notes: [],
              tags: [],
              metrics: {},
            },
          ]}
          tracks={[
            {
              id: "track-1",
              title: "Main track",
              sourcePath: "/music/main.wav",
              storagePath: "/music/main.wav",
              importedAt: "2026-06-29",
              bpm: 126,
              bpmConfidence: 0.8,
              durationSeconds: 240,
              waveformBins: [],
              beatGrid: [],
              bpmCurve: [],
              analyzerStatus: "ready",
              repoSuggestedBpm: 126,
              repoSuggestedStatus: "ready",
              notes: [],
              fileExtension: "wav",
              analysisMode: "librosa",
              musicStyleId: "house",
              musicStyleLabel: "House",
              keySignature: null,
              energyLevel: null,
              danceability: null,
              structuralPatterns: [],
              file: {
                sourcePath: "/music/main.wav",
                storagePath: "/music/main.wav",
                sourceKind: "file",
                fileExtension: "wav",
                sizeBytes: null,
                modifiedAt: null,
                checksum: null,
                availabilityState: "available",
                playbackSource: "source_file",
              },
              tags: {
                title: "Main track",
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
                importedAt: "2026-06-29",
                bpm: 126,
                bpmConfidence: 0.8,
                durationSeconds: 240,
                waveformBins: [],
                beatGrid: [],
                bpmCurve: [],
                analyzerStatus: "ready",
                analysisMode: "librosa",
                analyzerVersion: null,
                analyzedAt: null,
                repoSuggestedBpm: 126,
                repoSuggestedStatus: "ready",
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
          ]}
          playlists={[]}
          repositories={[]}
          onImportComposition={onImportComposition}
        />
      </I18nContext.Provider>,
    );

    fireEvent.change(
      screen.getByPlaceholderText(en.compose.forms.compositionLabelPlaceholder),
      { target: { value: "Night shift" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: en.compose.forms.createComposition }),
    );

    await waitFor(() => {
      expect(onImportComposition).toHaveBeenCalledWith({
        baseAssetId: "base-1",
        trackId: "track-1",
        playlistId: undefined,
        structureId: undefined,
        referenceType: "track",
        referenceAssetId: "track-1",
        label: "Night shift",
      });
    });
  });

  it("switches to playlist mode and prefers repository structures when selected", async () => {
    const onImportComposition = vi.fn(async () => true);

    renderWithI18n(
      <ImportCompositionForm
        busy={false}
        baseAssets={[
          {
            id: "base-1",
            title: "Reactive bed",
            sourcePath: "/packs/base",
            storagePath: "/packs/base",
            sourceKind: "directory",
            importedAt: "2026-06-29",
            categoryId: "reactive",
            categoryLabel: "Reactive",
            reusable: true,
            entryCount: 16,
            checksum: null,
            confidence: 0.9,
            summary: "Summary",
            analyzerStatus: "ready",
            notes: [],
            tags: [],
            metrics: {},
          },
        ]}
        tracks={[]}
        playlists={[
          {
            id: "playlist-1",
            name: "Warmup",
            trackIds: ["track-1", "track-2"],
            createdAt: "2026-06-29",
            updatedAt: "2026-06-29",
          },
        ]}
        repositories={[
          {
            id: "repo-1",
            title: "service-logs",
            sourcePath: "/logs/service.log",
            importedAt: "2026-06-29",
            parserStatus: "ready",
            suggestedBpm: 128,
            confidence: 0.9,
            summary: "Repo summary",
            notes: [],
            components: [],
            metrics: {},
          } as never,
        ]}
        onImportComposition={onImportComposition}
      />,
    );

    expect(screen.getByRole("button", { name: en.compose.forms.basePlaylist })).toHaveClass(
      "active",
    );

    fireEvent.change(screen.getByDisplayValue(en.compose.forms.structureNone), {
      target: { value: "repo-1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: en.compose.forms.createComposition }),
    );

    await waitFor(() => {
      expect(onImportComposition).toHaveBeenCalledWith({
        baseAssetId: "base-1",
        trackId: undefined,
        playlistId: "playlist-1",
        structureId: "repo-1",
        referenceType: "repo",
        referenceAssetId: "repo-1",
        label: undefined,
      });
    });
  });
});
