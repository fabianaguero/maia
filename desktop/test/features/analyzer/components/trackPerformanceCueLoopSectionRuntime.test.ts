import { describe, expect, it } from "vitest";

import { en } from "../../../../src/i18n/en";
import {
  buildTrackPerformanceCueLoopBeatLoopHint,
  buildTrackPerformanceCueLoopPhraseViewModel,
  buildTrackPerformanceCueLoopPlayheadHint,
  buildTrackPerformanceCueLoopPresetActions,
  buildTrackPerformanceCueLoopPrimaryActions,
  buildTrackPerformanceCueLoopStatusRows,
} from "../../../../src/features/analyzer/components/trackPerformanceCueLoopSectionRuntime";

describe("trackPerformanceCueLoopSectionRuntime", () => {
  it("builds status rows and the playhead hint", () => {
    expect(
      buildTrackPerformanceCueLoopStatusRows({
        performanceColor: "#f59e0b",
        quantizeEnabled: true,
        quantizeAvailable: true,
        t: en,
      }),
    ).toEqual([
      { key: "color", label: "Color tag", value: "#f59e0b" },
      { key: "quantize", label: "Quantize", value: "On" },
    ]);

    expect(
      buildTrackPerformanceCueLoopPlayheadHint({
        currentTime: 12.5,
        quantizedPlacementHint: " snapped",
        t: en,
      }),
    ).toContain("snapped");
  });

  it("builds primary cue actions and beat-loop actions", () => {
    const primary = buildTrackPerformanceCueLoopPrimaryActions({
      canEditPerformance: true,
      canAddHot: false,
      hasMainCue: true,
      quantizeEnabled: false,
      quantizeAvailable: true,
      t: en,
    });

    expect(primary.quantizeToggleLabel).toBe("Quantize off");
    expect(primary.actions).toEqual([
      { key: "set-main-cue", label: "Set main cue", disabled: false },
      { key: "clear-main-cue", label: "Clear main cue", disabled: false },
      { key: "add-hot-cue", label: "Add hot cue", disabled: true },
      { key: "add-memory-cue", label: "Add memory cue", disabled: false },
    ]);

    expect(
      buildTrackPerformanceCueLoopPresetActions({
        canEditPerformance: true,
        canAddLoop: true,
        canCreateBeatLoopAtPlacement: (beatCount) => beatCount <= 8,
        t: en,
      }),
    ).toEqual([
      { beatCount: 4, label: "Save 4-beat loop", disabled: false },
      { beatCount: 8, label: "Save 8-beat loop", disabled: false },
      { beatCount: 16, label: "Save 16-beat loop", disabled: true },
    ]);
  });

  it("builds phrase selection state and beat-loop helper copy", () => {
    expect(
      buildTrackPerformanceCueLoopBeatLoopHint({
        bpm: 126,
        t: en,
      }),
    ).toBe("Beat loops from detected BPM 126.0");

    const phraseView = buildTrackPerformanceCueLoopPhraseViewModel({
      selectedPhraseRange: {
        startSecond: 32,
        endSecond: 48,
        label: "Phrase A",
        startBeatIndex: 64,
        endBeatIndex: 96,
      },
      canEditPerformance: true,
      canAddLoop: false,
      t: en,
    });

    expect(phraseView?.selectionSummary).toContain("Phrase A");
    expect(phraseView?.actions).toEqual([
      { key: "set-phrase-cue", label: "Set cue to phrase start", disabled: false },
      { key: "add-phrase-memory-cue", label: "Add phrase memory cue", disabled: false },
      { key: "save-phrase-loop", label: "Save phrase loop", disabled: true },
    ]);

    expect(
      buildTrackPerformanceCueLoopPhraseViewModel({
        selectedPhraseRange: null,
        canEditPerformance: false,
        canAddLoop: false,
        t: en,
      }),
    ).toEqual({
      selectionSummary:
        "Arm phrase select on the waveform to capture phrase-aligned cues and loops.",
      actions: [],
    });
  });
});
