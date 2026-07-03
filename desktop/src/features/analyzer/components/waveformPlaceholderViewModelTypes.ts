import type { AppTranslations } from "../../../i18n/en";
import type {
  BeatGridPoint,
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";
import type { BeatGridGuideMarker, BeatGridPhraseRange } from "../../../utils/beatGrid";
import type {
  DragTarget,
  RenderedCueMarker,
  RenderedRegion,
  WaveformEditableCuePoint,
  WaveformHintState,
  WaveformPlayheadOverlayState,
  WaveformSummaryPillViewModel,
} from "./waveformPlaceholderRuntime";

export interface WaveformPlaceholderInteractionState {
  gridClickArmed: boolean;
  phraseSelectArmed: boolean;
  gridAnchorDragging: boolean;
  dragAnchorSecond: number | null;
  dragTarget: DragTarget | null;
  dragEditSecond: number | null;
}

export interface WaveformPlaceholderDerivedViewModel {
  displayBins: number[];
  visibleBeats: BeatGridGuideMarker[];
  anchorSecond: number | null;
  anchorPosition: number | null;
  showRegionSummary: boolean;
  showPhraseSummary: boolean;
  renderedCueMarkers: RenderedCueMarker[];
  renderedRegions: RenderedRegion[];
  interactionHints: WaveformHintState;
  playheadOverlay: WaveformPlayheadOverlayState;
  summaryPills: WaveformSummaryPillViewModel[];
  cursor: CSSStyleDeclaration["cursor"];
}

export interface BuildWaveformPlaceholderViewModelInput {
  t: AppTranslations;
  bins: number[];
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  hotCues: VisualizationCuePoint[];
  regions: VisualizationRegionPoint[];
  editableCues: WaveformEditableCuePoint[];
  editableLoops: TrackSavedLoop[];
  currentTime: number;
  analysisProgress: number | null;
  canEditBeatGrid: boolean;
  canSelectPhrase: boolean;
  selectedPhraseRange: BeatGridPhraseRange | null;
  onSeek?: (second: number) => void;
  onSelectPhraseRange?: (range: BeatGridPhraseRange) => void;
  phraseBeatCount: number;
  interactions: WaveformPlaceholderInteractionState;
}
