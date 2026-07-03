import type { AppTranslations } from "../../../i18n/types";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { formatTrackTime } from "../../../utils/track";
import { LOOP_BEAT_PRESETS } from "./trackPerformancePanelRuntime";

export interface TrackPerformanceCueLoopStatusRowViewModel {
  key: "color" | "quantize";
  label: string;
  value: string;
}

export interface TrackPerformanceCueLoopActionViewModel {
  key:
    | "set-main-cue"
    | "clear-main-cue"
    | "add-hot-cue"
    | "add-memory-cue"
    | "set-phrase-cue"
    | "add-phrase-memory-cue"
    | "save-phrase-loop";
  label: string;
  disabled: boolean;
}

export interface TrackPerformanceCueLoopPresetViewModel {
  beatCount: number;
  label: string;
  disabled: boolean;
}

export interface TrackPerformanceCueLoopPhraseViewModel {
  selectionSummary: string;
  actions: TrackPerformanceCueLoopActionViewModel[];
}

export function buildTrackPerformanceCueLoopStatusRows(input: {
  performanceColor: string | null;
  quantizeEnabled: boolean;
  quantizeAvailable: boolean;
  t: AppTranslations;
}): TrackPerformanceCueLoopStatusRowViewModel[] {
  return [
    {
      key: "color",
      label: input.t.inspect.colorTag,
      value: input.performanceColor ?? input.t.inspect.none,
    },
    {
      key: "quantize",
      label: input.t.inspect.quantize,
      value:
        input.quantizeEnabled && input.quantizeAvailable ? input.t.inspect.on : input.t.inspect.off,
    },
  ];
}

export function buildTrackPerformanceCueLoopPlayheadHint(input: {
  currentTime: number;
  quantizedPlacementHint: string;
  t: AppTranslations;
}): string {
  return (
    input.t.inspect.playheadCueToolsAt.replace(
      "{time}",
      formatTrackTime(input.currentTime, input.t.inspect.pending),
    ) + input.quantizedPlacementHint
  );
}

export function buildTrackPerformanceCueLoopPrimaryActions(input: {
  canEditPerformance: boolean;
  canAddHot: boolean;
  hasMainCue: boolean;
  quantizeEnabled: boolean;
  quantizeAvailable: boolean;
  t: AppTranslations;
}): {
  quantizeToggleLabel: string;
  actions: TrackPerformanceCueLoopActionViewModel[];
} {
  return {
    quantizeToggleLabel:
      input.quantizeEnabled && input.quantizeAvailable
        ? input.t.inspect.quantizeOn
        : input.t.inspect.quantizeOff,
    actions: [
      {
        key: "set-main-cue",
        label: input.t.inspect.setMainCue,
        disabled: !input.canEditPerformance,
      },
      {
        key: "clear-main-cue",
        label: input.t.inspect.clearMainCue,
        disabled: !input.canEditPerformance || !input.hasMainCue,
      },
      {
        key: "add-hot-cue",
        label: input.t.inspect.addHotCue,
        disabled: !input.canEditPerformance || !input.canAddHot,
      },
      {
        key: "add-memory-cue",
        label: input.t.inspect.addMemoryCue,
        disabled: !input.canEditPerformance,
      },
    ],
  };
}

export function buildTrackPerformanceCueLoopBeatLoopHint(input: {
  bpm: number | null;
  t: AppTranslations;
}): string {
  return input.t.inspect.beatLoopsFromDetectedBpm.replace(
    "{bpm}",
    typeof input.bpm === "number" ? input.bpm.toFixed(1) : input.t.inspect.pending,
  );
}

export function buildTrackPerformanceCueLoopPresetActions(input: {
  canEditPerformance: boolean;
  canAddLoop: boolean;
  canCreateBeatLoopAtPlacement: (beatCount: number) => boolean;
  t: AppTranslations;
}): TrackPerformanceCueLoopPresetViewModel[] {
  return LOOP_BEAT_PRESETS.map((beatCount) => ({
    beatCount,
    label: input.t.inspect.saveBeatLoop.replace("{count}", String(beatCount)),
    disabled:
      !input.canEditPerformance ||
      !input.canAddLoop ||
      !input.canCreateBeatLoopAtPlacement(beatCount),
  }));
}

export function buildTrackPerformanceCueLoopPhraseViewModel(input: {
  selectedPhraseRange: BeatGridPhraseRange | null;
  canEditPerformance: boolean;
  canAddLoop: boolean;
  t: AppTranslations;
}): TrackPerformanceCueLoopPhraseViewModel | null {
  if (!input.selectedPhraseRange) {
    return {
      selectionSummary: input.t.inspect.armPhraseSelect,
      actions: [],
    };
  }

  return {
    selectionSummary: input.t.inspect.phraseSelected
      .replace("{label}", input.selectedPhraseRange.label)
      .replace(
        "{start}",
        formatTrackTime(input.selectedPhraseRange.startSecond, input.t.inspect.pending),
      )
      .replace(
        "{end}",
        formatTrackTime(input.selectedPhraseRange.endSecond, input.t.inspect.pending),
      ),
    actions: [
      {
        key: "set-phrase-cue",
        label: input.t.inspect.setCuePhraseStart,
        disabled: !input.canEditPerformance,
      },
      {
        key: "add-phrase-memory-cue",
        label: input.t.inspect.addPhraseMemoryCue,
        disabled: !input.canEditPerformance,
      },
      {
        key: "save-phrase-loop",
        label: input.t.inspect.savePhraseLoop,
        disabled: !input.canEditPerformance || !input.canAddLoop,
      },
    ],
  };
}
