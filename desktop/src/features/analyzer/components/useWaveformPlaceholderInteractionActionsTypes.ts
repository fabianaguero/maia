import type { Dispatch, SetStateAction } from "react";

import type { BeatGridPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import type { DragTarget, WaveformEditableCuePoint } from "./waveformPlaceholderRuntime";

export interface UseWaveformPlaceholderInteractionActionsInput {
  stageRef: { current: HTMLDivElement | null };
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  phraseBeatCount: number;
  gridClickArmed: boolean;
  phraseSelectArmed: boolean;
  onSeek?: (second: number) => void;
  onSetDownbeatAtSecond?: (second: number) => void;
  onSelectPhraseRange?: (range: BeatGridPhraseRange) => void;
  dragMovedRef: { current: boolean };
  dragStartClientXRef: { current: number | null };
  dragAnchorSecondRef: { current: number | null };
  dragEditSecondRef: { current: number | null };
  setGridClickArmed: Dispatch<SetStateAction<boolean>>;
  setPhraseSelectArmed: Dispatch<SetStateAction<boolean>>;
  setGridAnchorDragging: Dispatch<SetStateAction<boolean>>;
  setDragAnchorSecond: Dispatch<SetStateAction<number | null>>;
  setDragTarget: Dispatch<SetStateAction<DragTarget | null>>;
  setDragEditSecond: Dispatch<SetStateAction<number | null>>;
}

export interface WaveformCueDragInput {
  eventClientX: number;
  cue: WaveformEditableCuePoint;
  second: number;
}

export interface WaveformLoopDragInput {
  eventClientX: number;
  loopId: string;
  startSecond: number;
  endSecond: number;
  pointerOffsetSecond: number;
}

export interface WaveformLoopBoundaryDragInput {
  eventClientX: number;
  loopId: string;
  boundary: "start" | "end";
  second: number;
}
