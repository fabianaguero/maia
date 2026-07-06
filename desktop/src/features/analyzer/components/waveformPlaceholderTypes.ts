import type {
  BeatGridPoint,
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import type { WaveformEditableCuePoint } from "./waveformPlaceholderRuntime";

export interface WaveformPlaceholderProps {
  bins: number[];
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  hotCues?: VisualizationCuePoint[];
  regions?: VisualizationRegionPoint[];
  editableCues?: WaveformEditableCuePoint[];
  editableLoops?: TrackSavedLoop[];
  currentTime?: number;
  hero?: boolean;
  onSeek?: (second: number) => void;
  analysisProgress?: number | null;
  canEditBeatGrid?: boolean;
  onSetDownbeatAtSecond?: (second: number) => void;
  canSelectPhrase?: boolean;
  selectedPhraseRange?: BeatGridPhraseRange | null;
  onSelectPhraseRange?: (range: BeatGridPhraseRange) => void;
  phraseBeatCount?: number;
  canEditPerformance?: boolean;
  onMoveCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onNudgeCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onMoveLoopBoundary?: (loopId: string, boundary: "start" | "end", second: number) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
}
