import type { BeatGridPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import type { WaveformEditableCuePoint } from "./waveformPlaceholderRuntime";
import type { WaveformPlaceholderInteractionState } from "./waveformPlaceholderViewModelTypes";
import type { useWaveformPlaceholderInteractionState } from "./useWaveformPlaceholderInteractionState";

export interface UseWaveformPlaceholderInteractionsInput {
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  canEditBeatGrid: boolean;
  canSelectPhrase: boolean;
  canEditPerformance: boolean;
  phraseBeatCount: number;
  onSeek?: (second: number) => void;
  onSetDownbeatAtSecond?: (second: number) => void;
  onSelectPhraseRange?: (range: BeatGridPhraseRange) => void;
  onMoveCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onMoveLoopBoundary?: (loopId: string, boundary: "start" | "end", second: number) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
}

export type WaveformPlaceholderInteractionHookState = ReturnType<
  typeof useWaveformPlaceholderInteractionState
>;

export type UseWaveformPlaceholderInteractionsResult = WaveformPlaceholderInteractionState & {
  stageRef: WaveformPlaceholderInteractionHookState["stageRef"];
  dragMovedRef: WaveformPlaceholderInteractionHookState["dragMovedRef"];
  resolveSecondFromClientX: (clientX: number) => number | null;
  handleWaveformClick: (clientX: number) => void;
  handleBeginCueDrag: (input: {
    eventClientX: number;
    cue: WaveformEditableCuePoint;
    second: number;
  }) => void;
  handleBeginLoopDrag: (input: {
    eventClientX: number;
    loopId: string;
    startSecond: number;
    endSecond: number;
    pointerOffsetSecond: number;
  }) => void;
  handleBeginLoopBoundaryDrag: (input: {
    eventClientX: number;
    loopId: string;
    boundary: "start" | "end";
    second: number;
  }) => void;
  consumeDraggedClick: () => boolean;
  toggleGridClickArmed: () => void;
  togglePhraseSelectArmed: () => void;
  beginAnchorDrag: (anchorSecond: number | null) => void;
};
