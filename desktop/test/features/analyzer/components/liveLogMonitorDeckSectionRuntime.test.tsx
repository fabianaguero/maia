import { describe, expect, it, vi } from "vitest";

import type { AppTranslations } from "../../../../src/i18n/types";
import {
  buildLiveLogMonitorDeckActivityPanelProps,
  buildLiveLogMonitorPerformanceSummaryProps,
  buildLiveLogMonitorSequencerPanelProps,
  buildLiveLogMonitorTracePanelProps,
} from "../../../../src/features/analyzer/components/liveLogMonitorDeckSectionRuntime";

function createTranslations(): AppTranslations {
  return {
    inspect: {
      liveSystemRhythm: "Live system rhythm",
      liveSystemRhythmCopy: "Pulse copy",
      awaitingSystemPulse: "Awaiting pulse",
      idleUpper: "Idle",
      waveAnomalyMarkers: "Anomaly markers",
      noAnomalyMarkersLatestWindows: "No anomalies",
      waveSourceStream: "Source stream",
      streamTailSync: "Tail sync",
      syncTailAria: "Tail aria",
      waitingSynchronizedLines: "Waiting lines",
      anomalySourceLines: "Anomaly source lines",
      anomalySourceAria: "Anomaly source aria",
      noAnomalyProducingLine: "No anomaly source",
      arrangementLayers: "Arrangement layers",
      arrangementLayersCopy: "Arrangement copy",
      noArrangementVoices: "No voices",
      padSequencerTitle: "Pad sequencer",
      padSequencerCopy: "Pad sequencer copy",
      recentCuesTitle: "Recent cues",
      recentCuesCopy: "Recent cues copy",
      noLiveCues: "No live cues",
      recentAnomalyMarkersTitle: "Recent anomaly markers",
      recentAnomalyMarkersCopy: "Recent anomaly markers copy",
      eventLabel: "Event",
      noAnomalyMarkersSession: "No anomaly session",
      monitorNotesTitle: "Monitor notes",
      monitorNotesCopy: "Monitor notes copy",
      runtimeError: "Runtime error",
      monitorNoteLabel: "Monitor note",
    },
  } as unknown as AppTranslations;
}

describe("liveLogMonitorDeckSectionRuntime", () => {
  it("builds activity panel props with tropical theme and activity labels", () => {
    const props = buildLiveLogMonitorDeckActivityPanelProps({
      t: createTranslations(),
      sceneGenreId: "tropical-house",
      recentCues: [],
      waveAnomalyMarkers: [],
      liveSourceLabel: "/logs/service.log",
      recentSyncTailRows: [],
      anomalySourceRows: [],
      activeTailWindowId: "tail-1",
      syncTailListRef: { current: null },
      waveform: "waveform",
    });

    expect(props.waveform).toBe("waveform");
    expect(props.isTropicalTheme).toBe(true);
    expect(props.maxRecentCues).toBe(8);
    expect(props.labels.liveSystemRhythm).toBe("Live system rhythm");
    expect(props.labels.noAnomalyProducingLine).toBe("No anomaly source");
  });

  it("builds trace panel props with the passed selection callback", () => {
    const onSelectExplanation = vi.fn();
    const props = buildLiveLogMonitorTracePanelProps({
      replayActive: true,
      playbackEventIndex: 3,
      traceWaveformTrack: null,
      traceWaveformExplanations: [],
      traceWaveformCues: [],
      traceWaveformCurrentTime: 12.5,
      recentExplanations: [],
      selectedExplanationId: "exp-1",
      onSelectExplanation,
    });

    expect(props.playbackEventIndex).toBe(3);
    expect(props.selectedExplanationId).toBe("exp-1");
    expect(props.onSelectExplanation).toBe(onSelectExplanation);
  });

  it("builds performance summary labels and error payload", () => {
    const props = buildLiveLogMonitorPerformanceSummaryProps({
      t: createTranslations(),
      recentVoices: [],
      recentCues: [],
      recentMarkers: [],
      recentWarnings: ["warn"],
      error: "boom",
    });

    expect(props.error).toBe("boom");
    expect(props.recentWarnings).toEqual(["warn"]);
    expect(props.labels.padSequencerTitle).toBe("Pad sequencer");
    expect(props.labels.runtimeError).toBe("Runtime error");
  });

  it("builds sequencer props with bpm fallback order", () => {
    const onStepFire = vi.fn();

    expect(
      buildLiveLogMonitorSequencerPanelProps({
        beatClockBpm: 128,
        repositorySuggestedBpm: 120,
        recentVoices: [],
        onStepFire,
      }).bpm,
    ).toBe(128);

    expect(
      buildLiveLogMonitorSequencerPanelProps({
        beatClockBpm: null,
        repositorySuggestedBpm: 122,
        recentVoices: [],
        onStepFire,
      }).bpm,
    ).toBe(122);

    expect(
      buildLiveLogMonitorSequencerPanelProps({
        beatClockBpm: null,
        repositorySuggestedBpm: null,
        recentVoices: [],
        onStepFire,
      }).bpm,
    ).toBe(120);
  });
});
