import type {
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";

export interface WaveformEditableCuePoint {
  id: string;
  second: number;
  label: string;
  kind: "main" | "hot" | "memory";
  color?: string | null;
}

export type DragTarget =
  | {
      type: "cue";
      cue: WaveformEditableCuePoint;
    }
  | {
      type: "loop";
      loopId: string;
      startSecond: number;
      endSecond: number;
      pointerOffsetSecond: number;
    }
  | {
      type: "loop-boundary";
      loopId: string;
      boundary: "start" | "end";
    };

export interface RenderedCueMarker {
  key: string;
  second: number;
  label: string;
  type: string;
  excerpt?: string;
  interactiveCue: WaveformEditableCuePoint | null;
}

export interface RenderedRegion extends VisualizationRegionPoint {
  editableLoop: TrackSavedLoop | undefined;
}

export interface WaveformHintState {
  gridHint: string | null;
  phraseHint: string | null;
  dragHint: string | null;
}

export interface WaveformSummaryPillViewModel {
  key: "visible-beats" | "regions" | "grid-state" | "phrase";
  label: string;
  value: string;
}

export interface WaveformPlayheadOverlayState {
  progressPercent: number | null;
  analysisEndPercent: number | null;
  analysisEndTitle: string | null;
}

export type WaveformCueList = VisualizationCuePoint[];
