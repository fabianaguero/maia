import type { LibraryTrack } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { getTrackSourcePath, getTrackStoragePath } from "../../utils/track";
import type { AppTranslations } from "../../i18n/en";

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
