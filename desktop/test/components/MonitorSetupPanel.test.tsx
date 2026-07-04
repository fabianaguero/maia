import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { MonitorSetupPanel } from "../../src/features/simple/MonitorSetupPanel";
import type { LibraryTrack } from "../../src/types/library";
import type { MonitorLaunchSource } from "../../src/types/monitorLaunch";

afterEach(() => {
  cleanup();
});

function createTrack(id: string, title: string): LibraryTrack {
  return {
    id,
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: `/managed/${id}.wav`,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1024,
      modifiedAt: "2026-06-01T00:00:00.000Z",
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
    },
    tags: {
      title,
      artist: "Maia",
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-01T00:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4, 0.6],
      beatGrid: [{ index: 0, second: 0 }],
      bpmCurve: [{ second: 0, bpm: 126 }],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: "maia-analyzer",
      analyzedAt: "2026-06-01T00:00:00.000Z",
      repoSuggestedBpm: null,
      repoSuggestedStatus: "pending",
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
    title,
    sourcePath: `/music/${id}.wav`,
    storagePath: `/managed/${id}.wav`,
    importedAt: "2026-06-01T00:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2, 0.4, 0.6],
    beatGrid: [{ index: 0, second: 0 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "librosa-dsp",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
  };
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof MonitorSetupPanel>> = {}) {
  const onSourceFilterChange = vi.fn();
  const onSelectSourceId = vi.fn();
  const onSelectSoundId = vi.fn();
  const onToggleTrackPreview = vi.fn();
  const onStartMonitoringRequest = vi.fn();

  const sources: MonitorLaunchSource[] = [
    {
      id: "source-1",
      title: "visits-service",
      sourcePath: "/logs/visits-service.log",
      sourceType: "file",
      sourceTypeLabel: "Log file",
      startable: true,
      origin: "repository",
    },
    {
      id: "source-2",
      title: "services",
      sourcePath: "gcp-cloud-run://project/services",
      sourceType: "cloud",
      sourceTypeLabel: "Cloud connection",
      startable: true,
      origin: "connection",
      connectionId: "conn-1",
    },
  ];

  render(
    <I18nContext.Provider value={en}>
      <MonitorSetupPanel
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChange}
        filteredMonitorSourceOptions={sources}
        selectedSourceId="source-1"
        onSelectSourceId={onSelectSourceId}
        sourceEmptyMessage="No sources"
        tracks={[createTrack("track-1", "System Pulse"), createTrack("track-2", "Night Drive")]}
        selectedSoundId="track-1"
        onSelectSoundId={onSelectSoundId}
        getTrackTitle={(track) => track.tags.title ?? track.title}
        previewTrackId={null}
        onToggleTrackPreview={onToggleTrackPreview}
        canStartSelectedSource
        startHint="Ready"
        isLaunchingMonitor={false}
        onStartMonitoringRequest={onStartMonitoringRequest}
        {...overrides}
      />
    </I18nContext.Provider>,
  );

  return {
    onSourceFilterChange,
    onSelectSourceId,
    onSelectSoundId,
    onToggleTrackPreview,
    onStartMonitoringRequest,
  };
}

describe("MonitorSetupPanel", () => {
  it("renders source and track selectors and dispatches launch interactions", () => {
    const handlers = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.setup.cloud }));
    fireEvent.click(screen.getByRole("button", { name: "services" }));
    fireEvent.click(screen.getByRole("button", { name: "Night Drive" }));
    fireEvent.click(screen.getAllByRole("button", { name: en.simpleMode.setup.previewTrack })[1]);
    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.setup.initializeMonitoring }));

    expect(handlers.onSourceFilterChange).toHaveBeenCalledWith("cloud");
    expect(handlers.onSelectSourceId).toHaveBeenCalledWith("source-2");
    expect(handlers.onSelectSoundId).toHaveBeenCalledWith("track-2");
    expect(handlers.onToggleTrackPreview).toHaveBeenCalled();
    expect(handlers.onStartMonitoringRequest).toHaveBeenCalled();
  });

  it("disables launch while monitor bootstrap is unavailable", () => {
    renderPanel({
      canStartSelectedSource: false,
      startHint: "Disabled",
    });

    expect(
      screen.getByRole("button", { name: en.simpleMode.setup.initializeMonitoring }),
    ).toBeDisabled();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });
});
