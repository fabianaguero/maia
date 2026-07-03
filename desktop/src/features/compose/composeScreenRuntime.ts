import type { AppTranslations } from "../../i18n/en";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";

export type ComposeTab = "preview" | "structure" | "render" | "export";

export interface ComposeScreenViewModel {
  title: string;
  copy: string;
  canCompose: boolean;
  showSummary: boolean;
  compositionsCount: number;
  targetBpmLabel: string | null;
  timingSourceLabel: string | null;
  compositionOptions: Array<{
    id: string;
    label: string;
  }>;
  tabOptions: Array<{
    id: ComposeTab;
    label: string;
    isActive: boolean;
  }>;
}

export function resolveComposeCanCreate(input: {
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
}): boolean {
  return input.baseAssets.length > 0 && (input.tracks.length > 0 || input.playlists.length > 0);
}

export function buildComposeTabOptions(input: {
  t: AppTranslations;
  tab: ComposeTab;
}): ComposeScreenViewModel["tabOptions"] {
  return [
    { id: "preview", label: input.t.compose.previewTab, isActive: input.tab === "preview" },
    { id: "structure", label: input.t.compose.structureTab, isActive: input.tab === "structure" },
    { id: "render", label: input.t.compose.renderTab, isActive: input.tab === "render" },
    { id: "export", label: input.t.compose.exportTab, isActive: input.tab === "export" },
  ];
}

export function buildComposeScreenViewModel(input: {
  t: AppTranslations;
  tab: ComposeTab;
  composition: CompositionResultRecord | null;
  compositions: CompositionResultRecord[];
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
}): ComposeScreenViewModel {
  return {
    title: input.composition ? input.composition.title : input.t.compose.title,
    copy: input.t.compose.copy,
    canCompose: resolveComposeCanCreate({
      baseAssets: input.baseAssets,
      tracks: input.tracks,
      playlists: input.playlists,
    }),
    showSummary: input.compositions.length > 0,
    compositionsCount: input.compositions.length,
    targetBpmLabel: input.composition ? input.composition.targetBpm.toFixed(0) : null,
    timingSourceLabel: input.composition ? input.composition.referenceTitle : null,
    compositionOptions: input.compositions.map((composition) => ({
      id: composition.id,
      label: `${composition.title} · ${composition.targetBpm.toFixed(0)} BPM · ${formatShortDate(composition.importedAt)}`,
    })),
    tabOptions: buildComposeTabOptions({
      t: input.t,
      tab: input.tab,
    }),
  };
}
