import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildActiveMonitorDeckViewModel,
  formatActiveMonitorDeckTime,
} from "../../../src/features/simple/activeMonitorDeckViewModel";

describe("activeMonitorDeckViewModel", () => {
  it("formats deck times for elapsed and missing values", () => {
    expect(formatActiveMonitorDeckTime(75)).toBe("1:15");
    expect(formatActiveMonitorDeckTime(null)).toBe("--:--");
    expect(formatActiveMonitorDeckTime(-4)).toBe("--:--");
  });

  it("builds live monitor deck state with visible lines and active audio", () => {
    const viewModel = buildActiveMonitorDeckViewModel({
      t: en,
      isConnectingMonitor: false,
      totalAnomalies: 12,
      uptimeLabel: "1m 22s",
      streamAdapterLabel: "file",
      liveLineCount: 64,
      audioStatus: "running",
      monitorTrackTitle: "Around The World",
      musicStyleLabel: "House",
      deckBpm: 126,
      trackElapsedSeconds: 82,
      deckRemainingSeconds: 238,
      selectedDeckMarker: {
        id: "marker-1",
        progress: 0.33,
        severity: 0.95,
        timestamp: "00:41",
        message: "HTTP 500 burst",
      },
      selectedBurstCount: 4,
    });

    expect(viewModel.headerStatusLabel).toBe(en.simpleMode.monitor.systemActive);
    expect(viewModel.headerStatusTone).toBe("live");
    expect(viewModel.headerMetrics[0]).toMatchObject({
      key: "anomalies",
      value: "12",
      tone: "alert",
    });
    expect(viewModel.deckTrackLine).toBe("Around The World · House");
    expect(viewModel.legendItems).toEqual([
      {
        key: "track",
        label: en.simpleMode.monitor.legendTrack,
        tone: "track",
      },
      {
        key: "warn",
        label: en.simpleMode.monitor.legendLog,
        tone: "warn",
      },
      {
        key: "error",
        label: en.simpleMode.monitor.legendAnomaly,
        tone: "error",
      },
    ]);
    expect(viewModel.metaChips.map((chip) => chip.label)).toEqual([
      `${en.simpleMode.monitor.bpmChip} 126`,
      `${en.simpleMode.monitor.elapsedChip} 1:22`,
      `${en.simpleMode.monitor.remainingChip} -3:58`,
    ]);
    expect(viewModel.focusBadgeLabel).toBe(en.simpleMode.monitor.activeAnomaly);
    expect(viewModel.focusBadgeTone).toBe("critical");
    expect(viewModel.focusCueCode).toBe("marker-1");
    expect(viewModel.focusBurstLabel).toBe(`${en.simpleMode.monitor.burst} 4`);
    expect(viewModel.streamStatusLabel).toBe("file: 64 visible lines");
    expect(viewModel.audioStatusLabel).toBe(en.simpleMode.common.audioActive);
    expect(viewModel.audioStatusTone).toBe("live");
  });

  it("builds connecting state with idle audio and no focus marker", () => {
    const viewModel = buildActiveMonitorDeckViewModel({
      t: en,
      isConnectingMonitor: true,
      totalAnomalies: 0,
      uptimeLabel: "0s",
      streamAdapterLabel: "gcp",
      liveLineCount: 0,
      audioStatus: "suspended",
      monitorTrackTitle: "",
      musicStyleLabel: null,
      deckBpm: null,
      trackElapsedSeconds: null,
      deckRemainingSeconds: null,
      selectedDeckMarker: null,
      selectedBurstCount: null,
    });

    expect(viewModel.headerStatusLabel).toBe(en.simpleMode.monitor.connectingStream);
    expect(viewModel.headerStatusTone).toBe("pending");
    expect(viewModel.deckTrackLine).toBe(en.simpleMode.monitor.liveIngestionFallback);
    expect(viewModel.metaChips.map((chip) => chip.label)).toEqual([
      `${en.simpleMode.monitor.bpmChip} --`,
      `${en.simpleMode.monitor.elapsedChip} --:--`,
      `${en.simpleMode.monitor.remainingChip} ---:--`,
    ]);
    expect(viewModel.focusBadgeLabel).toBeNull();
    expect(viewModel.focusCueCode).toBeNull();
    expect(viewModel.streamStatusLabel).toBe("gcp: connecting");
    expect(viewModel.audioStatusLabel).toBe(en.simpleMode.monitor.audioStatusPaused);
    expect(viewModel.audioStatusTone).toBe("muted");
  });

  it("prepends the active preset chip when provided", () => {
    const viewModel = buildActiveMonitorDeckViewModel({
      t: en,
      isConnectingMonitor: false,
      totalAnomalies: 3,
      uptimeLabel: "24s",
      streamAdapterLabel: "file",
      liveLineCount: 12,
      audioStatus: "running",
      monitorTrackTitle: "Sweet Dreams",
      musicStyleLabel: "House",
      deckPresetLabel: en.simpleMode.deckSetup.presetAlert,
      deckBpm: 125,
      trackElapsedSeconds: 15,
      deckRemainingSeconds: 245,
      selectedDeckMarker: null,
      selectedBurstCount: null,
    });

    expect(viewModel.metaChips.map((chip) => chip.label)).toEqual([
      `${en.simpleMode.monitor.presetChip} ${en.simpleMode.deckSetup.presetAlert}`,
      `${en.simpleMode.monitor.bpmChip} 125`,
      `${en.simpleMode.monitor.elapsedChip} 0:15`,
      `${en.simpleMode.monitor.remainingChip} -4:05`,
    ]);
  });
});
