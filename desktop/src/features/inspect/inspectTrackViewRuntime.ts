import type {
  LibraryTrack,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import { createAnchoredBeatGridUpdate, isEditableBpm } from "../../utils/beatGrid";
import { formatShortDate } from "../../utils/date";
import {
  getTrackSourcePath,
  getTrackStoragePath,
  hasUsableBeatGrid,
  moveTrackSavedLoop,
  resolveTrackPlacementSecond,
  setTrackCuePointSecond,
  setTrackSavedLoopBoundary,
} from "../../utils/track";
import type { AppTranslations } from "../../i18n/en";
import type { WaveformEditableCuePoint } from "../analyzer/components/waveformPlaceholderRuntime";

export type InspectTrackTabId = "overview" | "grid" | "performance" | "metadata";

export interface InspectTrackTabViewModel {
  id: InspectTrackTabId;
  label: string;
  panelId: `tab-${InspectTrackTabId}`;
}

export interface InspectTrackSummaryPillViewModel {
  key: "status" | "style" | "imported";
  label: string;
  value: string;
}

export interface InspectTrackMetadataDetailViewModel {
  key: "analysis-mode" | "source-path" | "storage-path";
  label: string;
  value: string;
}

export interface InspectTrackWaveformModel {
  editableTrackBpm: number | null;
  quantizeWaveformEdits: boolean;
  canEditBeatGrid: boolean;
  editableCues: WaveformEditableCuePoint[];
}

export function formatInspectTrackAnalysisMode(analysisMode: string): string {
  return analysisMode
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function buildInspectTrackTabViewModel(t: AppTranslations): InspectTrackTabViewModel[] {
  return [
    {
      id: "overview",
      label: t.inspect.overview,
      panelId: "tab-overview",
    },
    {
      id: "grid",
      label: t.inspect.beatGrid,
      panelId: "tab-grid",
    },
    {
      id: "performance",
      label: t.inspect.performance,
      panelId: "tab-performance",
    },
    {
      id: "metadata",
      label: t.inspect.details,
      panelId: "tab-metadata",
    },
  ];
}

export function buildInspectTrackSummaryPills(
  track: LibraryTrack,
  t: AppTranslations,
): InspectTrackSummaryPillViewModel[] {
  return [
    {
      key: "status",
      label: t.inspect.status,
      value: track.analysis.analyzerStatus,
    },
    {
      key: "style",
      label: t.inspect.style,
      value: track.tags.musicStyleLabel,
    },
    {
      key: "imported",
      label: t.inspect.imported,
      value: formatShortDate(track.analysis.importedAt),
    },
  ];
}

export function buildInspectTrackMetadataDetails(
  track: LibraryTrack,
  t: AppTranslations,
): InspectTrackMetadataDetailViewModel[] {
  return [
    {
      key: "analysis-mode",
      label: t.inspect.analysisMode,
      value: formatInspectTrackAnalysisMode(track.analysis.analysisMode),
    },
    {
      key: "source-path",
      label: t.inspect.sourcePath,
      value: getTrackSourcePath(track),
    },
    {
      key: "storage-path",
      label: t.inspect.storagePath,
      value: getTrackStoragePath(track) ?? t.inspect.noSnapshot,
    },
  ];
}

export function buildInspectTrackWaveformModel(input: {
  track: LibraryTrack;
  trackMutating: boolean;
}): InspectTrackWaveformModel {
  const editableTrackBpm = isEditableBpm(input.track.analysis.bpm)
    ? input.track.analysis.bpm
    : null;
  const quantizeWaveformEdits = hasUsableBeatGrid(input.track.analysis.beatGrid);

  return {
    editableTrackBpm,
    quantizeWaveformEdits,
    canEditBeatGrid:
      !input.trackMutating &&
      !input.track.performance.gridLock &&
      editableTrackBpm !== null &&
      input.track.analysis.durationSeconds !== null,
    editableCues: [
      ...(input.track.performance.mainCueSecond !== null
        ? [
            {
              id: "main-cue",
              second: input.track.performance.mainCueSecond,
              label: "Main",
              kind: "main" as const,
              color: input.track.performance.color,
            },
          ]
        : []),
      ...input.track.performance.hotCues.map((cue) => ({
        id: cue.id,
        second: cue.second,
        label: cue.label,
        kind: cue.kind,
        color: cue.color,
      })),
      ...input.track.performance.memoryCues.map((cue) => ({
        id: cue.id,
        second: cue.second,
        label: cue.label,
        kind: cue.kind,
        color: cue.color,
      })),
    ],
  };
}

export function buildInspectTrackAnchoredBeatGridAnalysisPatch(input: {
  track: LibraryTrack;
  second: number;
  editableTrackBpm: number | null;
}): UpdateTrackAnalysisInput | null {
  if (input.editableTrackBpm === null) {
    return null;
  }

  return createAnchoredBeatGridUpdate(
    input.editableTrackBpm,
    input.track.analysis.durationSeconds,
    input.second,
  );
}

export function buildInspectTrackMovedCuePerformancePatch(input: {
  track: LibraryTrack;
  cue: {
    id: string;
    second: number;
    label: string;
    kind: "main" | "hot" | "memory";
  };
  second: number;
  quantizeWaveformEdits: boolean;
}): UpdateTrackPerformanceInput {
  if (input.cue.kind === "main") {
    return {
      mainCueSecond: resolveTrackPlacementSecond(
        input.second,
        input.track.analysis.durationSeconds,
        input.track.analysis.beatGrid,
        input.quantizeWaveformEdits,
      ),
    };
  }

  const cueCollection =
    input.cue.kind === "hot" ? input.track.performance.hotCues : input.track.performance.memoryCues;
  const nextCues = setTrackCuePointSecond(cueCollection, input.cue.id, input.second, {
    durationSeconds: input.track.analysis.durationSeconds,
    beatGrid: input.track.analysis.beatGrid,
    quantizeEnabled: input.quantizeWaveformEdits,
  });

  return {
    [input.cue.kind === "hot" ? "hotCues" : "memoryCues"]: nextCues,
  };
}

export function buildInspectTrackMoveLoopBoundaryPerformancePatch(input: {
  track: LibraryTrack;
  loopId: string;
  boundary: "start" | "end";
  second: number;
  editableTrackBpm: number | null;
  quantizeWaveformEdits: boolean;
}): UpdateTrackPerformanceInput {
  return {
    savedLoops: setTrackSavedLoopBoundary(
      input.track.performance.savedLoops,
      input.loopId,
      input.boundary,
      input.second,
      {
        bpm: input.editableTrackBpm,
        durationSeconds: input.track.analysis.durationSeconds,
        beatGrid: input.track.analysis.beatGrid,
        quantizeEnabled: input.quantizeWaveformEdits,
      },
    ),
  };
}

export function buildInspectTrackMoveLoopPerformancePatch(input: {
  track: LibraryTrack;
  loopId: string;
  second: number;
  quantizeWaveformEdits: boolean;
}): UpdateTrackPerformanceInput {
  return {
    savedLoops: moveTrackSavedLoop(input.track.performance.savedLoops, input.loopId, input.second, {
      durationSeconds: input.track.analysis.durationSeconds,
      beatGrid: input.track.analysis.beatGrid,
      quantizeEnabled: input.quantizeWaveformEdits,
    }),
  };
}
