import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppMonitorOverview } from "../../src/components/AppMonitorOverview";
import type { MonitorMetrics } from "../../src/features/monitor/monitorContextTypes";
import type { LibraryTrack } from "../../src/types/library";

vi.mock("../../src/components/MonitorWaveformBar", () => ({
  MonitorWaveformBar: ({ tracks }: { tracks: LibraryTrack[] }) => (
    <div data-testid="monitor-waveform-bar">{tracks.map((track) => track.id).join(",")}</div>
  ),
}));

function createTrack(id: string): LibraryTrack {
  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-25T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
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
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1000,
      modifiedAt: "2026-06-25T10:00:00.000Z",
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: id,
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
      importedAt: "2026-06-25T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
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
  };
}

const baseMetrics: MonitorMetrics = {
  windowCount: 4,
  processedLines: 120,
  totalAnomalies: 6,
};

describe("AppMonitorOverview", () => {
  afterEach(() => {
    cleanup();
  });

  it("returns null when the overview should stay hidden", () => {
    const { container } = render(
      <AppMonitorOverview
        userMode="simple"
        selectedItemTitle="  Track One  "
        screenLabel="Monitor"
        detailDeckLabel="Deck view"
        liveLabel="Live"
        hasMonitorSession={true}
        monitorMetrics={baseMetrics}
        anomalyLabel="Anomalies"
        tracks={[createTrack("track-one")]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the expert overview with live anomaly status and waveform bar", () => {
    render(
      <AppMonitorOverview
        userMode="expert"
        selectedItemTitle="  Track One  "
        screenLabel="Monitor"
        detailDeckLabel="Deck view"
        liveLabel="Live"
        hasMonitorSession={true}
        monitorMetrics={baseMetrics}
        anomalyLabel="Anomalies"
        tracks={[createTrack("track-one"), createTrack("track-two")]}
      />,
    );

    expect(screen.getAllByText("Monitor")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Track One" })).toBeInTheDocument();
    expect(screen.getByText("Deck view")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("6 anomalies")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-waveform-bar")).toHaveTextContent("track-one,track-two");
  });

  it("renders the expert overview without live status when no monitor session is attached", () => {
    render(
      <AppMonitorOverview
        userMode="expert"
        selectedItemTitle="Track Silent"
        screenLabel="Monitor"
        detailDeckLabel="Deck view"
        liveLabel="Live"
        hasMonitorSession={false}
        monitorMetrics={baseMetrics}
        anomalyLabel="Anomalies"
        tracks={[createTrack("track-silent")]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Track Silent" })).toBeInTheDocument();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
    expect(screen.queryByText("6 anomalies")).not.toBeInTheDocument();
    expect(screen.getByTestId("monitor-waveform-bar")).toHaveTextContent("track-silent");
  });
});
