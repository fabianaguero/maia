import type { AppTranslations } from "../../../i18n/en";
import type { LibraryTrack, UpdateTrackAnalysisInput } from "../../../types/library";
import {
  isEditableBpm,
  resolveBeatDurationSeconds,
  resolveBeatGridAnchorSecond,
} from "../../../utils/beatGrid";
import { formatTrackTime } from "../../../utils/track";

export interface BeatGridEditorMetricViewModel {
  key: "grid-bpm" | "beat-markers" | "grid-anchor" | "beat-spacing" | "playhead" | "edit-state";
  label: string;
  value: string;
}

export interface BeatGridEditorPanelState {
  durationSeconds: number | null;
  beatGrid: LibraryTrack["analysis"]["beatGrid"];
  parsedBpm: number | null;
  effectiveBpm: number | null;
  canPersist: boolean;
  gridLocked: boolean;
  canEditGrid: boolean;
  hasGrid: boolean;
  canSetGrid: boolean;
  canNudgeGrid: boolean;
  canHalveBpm: boolean;
  canDoubleBpm: boolean;
  metrics: BeatGridEditorMetricViewModel[];
}

export function formatBeatSpacing(value: number | null, pendingLabel: string): string {
  if (value === null) {
    return pendingLabel;
  }

  return `${value.toFixed(3)}s`;
}

export function formatBpmInputValue(value: number | null): string {
  if (!isEditableBpm(value)) {
    return "";
  }

  return Number(value.toFixed(3)).toString();
}

export function parseEditableBpm(value: string): number | null {
  const parsed = Number(value.trim());
  return isEditableBpm(parsed) ? parsed : null;
}

export function buildBeatGridEditorPanelState(input: {
  track: LibraryTrack;
  busy: boolean;
  currentTime: number;
  bpmInput: string;
  onUpdateAnalysis?: ((input: UpdateTrackAnalysisInput) => Promise<void>) | undefined;
  t: AppTranslations;
}): BeatGridEditorPanelState {
  const { track, busy, currentTime, bpmInput, onUpdateAnalysis, t } = input;
  const durationSeconds = track.analysis.durationSeconds;
  const beatGrid = track.analysis.beatGrid;
  const parsedBpm = parseEditableBpm(bpmInput);
  const effectiveBpm = parsedBpm ?? track.analysis.bpm;
  const beatSpacing = resolveBeatDurationSeconds(track.analysis.bpm, beatGrid);
  const gridLocked = track.performance.gridLock;
  const canPersist = !busy && !!onUpdateAnalysis;
  const canEditGrid = canPersist && !gridLocked;
  const hasGrid = beatGrid.length > 0;
  const canSetGrid = canEditGrid && isEditableBpm(effectiveBpm) && durationSeconds !== null;
  const canNudgeGrid = canSetGrid && hasGrid;
  const canHalveBpm = isEditableBpm(effectiveBpm) ? isEditableBpm(effectiveBpm / 2) : false;
  const canDoubleBpm = isEditableBpm(effectiveBpm) ? isEditableBpm(effectiveBpm * 2) : false;

  return {
    durationSeconds,
    beatGrid,
    parsedBpm,
    effectiveBpm,
    canPersist,
    gridLocked,
    canEditGrid,
    hasGrid,
    canSetGrid,
    canNudgeGrid,
    canHalveBpm,
    canDoubleBpm,
    metrics: [
      {
        key: "grid-bpm",
        label: t.inspect.gridBpm,
        value: isEditableBpm(track.analysis.bpm)
          ? track.analysis.bpm.toFixed(2)
          : t.inspect.pending,
      },
      {
        key: "beat-markers",
        label: t.inspect.beatMarkers,
        value: String(beatGrid.length),
      },
      {
        key: "grid-anchor",
        label: t.inspect.gridAnchor,
        value: formatTrackTime(
          hasGrid ? resolveBeatGridAnchorSecond(beatGrid, 0) : null,
          t.inspect.pending,
        ),
      },
      {
        key: "beat-spacing",
        label: t.inspect.beatSpacing,
        value: formatBeatSpacing(beatSpacing, t.inspect.pending),
      },
      {
        key: "playhead",
        label: t.inspect.playhead,
        value: formatTrackTime(currentTime, t.inspect.pending),
      },
      {
        key: "edit-state",
        label: t.inspect.editState,
        value: !canPersist
          ? t.inspect.unavailable
          : gridLocked
            ? t.inspect.gridLockedState
            : t.inspect.ready,
      },
    ],
  };
}
