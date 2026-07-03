import type {
  LibraryTrack,
  TrackCuePoint,
  TrackSavedLoop,
  UpdateTrackPerformanceInput,
} from "../../../types/library";
import { formatShortDateTime } from "../../../utils/date";
import {
  canCreateHotCue,
  canCreateSavedLoop,
  formatTrackTime,
  hasUsableBeatGrid,
} from "../../../utils/track";

export interface TrackColorOption {
  value: string;
  label: string;
}

export interface TrackPerformanceMetricViewModel {
  key:
    | "availability"
    | "main-cue"
    | "hot-cues"
    | "memory-cues"
    | "saved-loops"
    | "rating"
    | "play-count"
    | "last-played"
    | "bpm-lock"
    | "grid-lock";
  label: string;
  value: string;
}

export function buildTrackColorOptions(t: {
  inspect: {
    none: string;
    amber: string;
    cyan: string;
    red: string;
    violet: string;
    lime: string;
  };
}): TrackColorOption[] {
  return [
    { value: "", label: t.inspect.none },
    { value: "#f59e0b", label: t.inspect.amber },
    { value: "#22d3ee", label: t.inspect.cyan },
    { value: "#ef4444", label: t.inspect.red },
    { value: "#8b5cf6", label: t.inspect.violet },
    { value: "#84cc16", label: t.inspect.lime },
  ];
}

export function renderCueLabel(
  cue: TrackCuePoint,
  slotTemplate: string,
  pendingLabel?: string,
): string {
  const slotLabel = cue.slot !== null ? slotTemplate.replace("{slot}", String(cue.slot)) : cue.kind;
  return `${cue.label} · ${formatTrackTime(cue.second, pendingLabel)} · ${slotLabel}`;
}

export function renderLoopLabel(
  loop: TrackSavedLoop,
  slotTemplate: string,
  loopWord: string,
  lockedLabel: string,
  editableLabel: string,
  pendingLabel?: string,
): string {
  const slotLabel =
    loop.slot !== null ? slotTemplate.replace("{slot}", String(loop.slot)) : loopWord;
  const lockLabel = loop.locked ? lockedLabel : editableLabel;
  return `${loop.label} · ${formatTrackTime(loop.startSecond, pendingLabel)} -> ${formatTrackTime(loop.endSecond, pendingLabel)} · ${slotLabel} · ${lockLabel}`;
}

export function buildTrackPerformancePanelState(input: {
  track: LibraryTrack;
  busy: boolean;
  currentTime: number;
  onUpdatePerformance?: ((update: UpdateTrackPerformanceInput) => Promise<void>) | undefined;
}): {
  durationSeconds: number | null;
  bpm: number | null;
  beatGrid: LibraryTrack["analysis"]["beatGrid"];
  canEditPerformance: boolean;
  canAddHot: boolean;
  canAddLoop: boolean;
  quantizeAvailable: boolean;
} {
  const { track, busy, onUpdatePerformance } = input;
  return {
    durationSeconds: track.analysis.durationSeconds,
    bpm: track.analysis.bpm,
    beatGrid: track.analysis.beatGrid,
    canEditPerformance: !busy && !!onUpdatePerformance,
    canAddHot: canCreateHotCue(track.performance.hotCues),
    canAddLoop: canCreateSavedLoop(track.performance.savedLoops),
    quantizeAvailable: hasUsableBeatGrid(track.analysis.beatGrid),
  };
}

export function buildTrackPerformanceMetrics(input: {
  track: LibraryTrack;
  t: {
    inspect: {
      availability: string;
      missing: string;
      available: string;
      mainCue: string;
      hotCues: string;
      memoryCues: string;
      savedLoops: string;
      rating: string;
      playCount: string;
      lastPlayed: string;
      never: string;
      bpmLockLabel: string;
      gridLockLabel: string;
      locked: string;
      open: string;
      pending: string;
    };
  };
}): TrackPerformanceMetricViewModel[] {
  const { performance, file } = input.track;

  return [
    {
      key: "availability",
      label: input.t.inspect.availability,
      value:
        file.availabilityState === "missing" ? input.t.inspect.missing : input.t.inspect.available,
    },
    {
      key: "main-cue",
      label: input.t.inspect.mainCue,
      value: formatTrackTime(performance.mainCueSecond, input.t.inspect.pending),
    },
    {
      key: "hot-cues",
      label: input.t.inspect.hotCues,
      value: String(performance.hotCues.length),
    },
    {
      key: "memory-cues",
      label: input.t.inspect.memoryCues,
      value: String(performance.memoryCues.length),
    },
    {
      key: "saved-loops",
      label: input.t.inspect.savedLoops,
      value: String(performance.savedLoops.length),
    },
    {
      key: "rating",
      label: input.t.inspect.rating,
      value: `${performance.rating}/5`,
    },
    {
      key: "play-count",
      label: input.t.inspect.playCount,
      value: String(performance.playCount),
    },
    {
      key: "last-played",
      label: input.t.inspect.lastPlayed,
      value: performance.lastPlayedAt
        ? formatShortDateTime(performance.lastPlayedAt)
        : input.t.inspect.never,
    },
    {
      key: "bpm-lock",
      label: input.t.inspect.bpmLockLabel,
      value: performance.bpmLock ? input.t.inspect.locked : input.t.inspect.open,
    },
    {
      key: "grid-lock",
      label: input.t.inspect.gridLockLabel,
      value: performance.gridLock ? input.t.inspect.locked : input.t.inspect.open,
    },
  ];
}
