import type { AppTranslations } from "../../../i18n/en";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionReferenceType,
  ImportCompositionInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";

export type CompositionBaseMode = "track" | "playlist";

export function deriveDefaultBaseAssetId(baseAssets: BaseAssetRecord[]): string {
  return baseAssets.find((entry) => entry.reusable)?.id ?? baseAssets[0]?.id ?? "";
}

export function resolveInitialCompositionBaseMode(input: {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
}): CompositionBaseMode {
  return input.tracks.length > 0 ? "track" : "playlist";
}

export function resolveValidCompositionSelection<T extends { id: string }>(
  currentId: string,
  entries: T[],
): string {
  return entries.some((entry) => entry.id === currentId) ? currentId : (entries[0]?.id ?? "");
}

export function resolveValidCompositionBaseMode(input: {
  baseMode: CompositionBaseMode;
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
}): CompositionBaseMode {
  if (input.baseMode === "track" && input.tracks.length === 0 && input.playlists.length > 0) {
    return "playlist";
  }

  if (input.baseMode === "playlist" && input.playlists.length === 0 && input.tracks.length > 0) {
    return "track";
  }

  return input.baseMode;
}

export function resolveCompositionReference(input: {
  baseMode: CompositionBaseMode;
  trackId: string;
  playlistId: string;
  structureId: string;
}): {
  referenceType: CompositionReferenceType;
  referenceAssetId: string | undefined;
} {
  if (input.structureId) {
    return {
      referenceType: "repo",
      referenceAssetId: input.structureId,
    };
  }

  if (input.baseMode === "playlist") {
    return {
      referenceType: "playlist",
      referenceAssetId: input.playlistId,
    };
  }

  return {
    referenceType: "track",
    referenceAssetId: input.trackId,
  };
}

export function validateImportCompositionForm(input: {
  t: AppTranslations;
  baseAssetId: string;
  baseMode: CompositionBaseMode;
  trackId: string;
  playlistId: string;
}): string | null {
  if (!input.baseAssetId.trim()) {
    return input.t.compose.forms.baseAssetRequiredError;
  }

  if (input.baseMode === "track" && !input.trackId.trim()) {
    return input.t.compose.forms.trackRequiredError;
  }

  if (input.baseMode === "playlist" && !input.playlistId.trim()) {
    return input.t.compose.forms.playlistRequiredError;
  }

  return null;
}

export function buildImportCompositionInput(input: {
  baseAssetId: string;
  baseMode: CompositionBaseMode;
  trackId: string;
  playlistId: string;
  structureId: string;
  label: string;
}): ImportCompositionInput {
  const reference = resolveCompositionReference({
    baseMode: input.baseMode,
    trackId: input.trackId,
    playlistId: input.playlistId,
    structureId: input.structureId,
  });

  return {
    baseAssetId: input.baseAssetId,
    trackId: input.baseMode === "track" ? input.trackId : undefined,
    playlistId: input.baseMode === "playlist" ? input.playlistId : undefined,
    structureId: input.structureId || undefined,
    referenceType: reference.referenceType,
    referenceAssetId: reference.referenceAssetId,
    label: input.label.trim() || undefined,
  };
}

export function buildImportCompositionResetState() {
  return {
    label: "",
  };
}

export function resolveImportCompositionSubmitDisabled(input: {
  busy: boolean;
  baseAssets: BaseAssetRecord[];
  baseMode: CompositionBaseMode;
  trackId: string;
  playlistId: string;
}): boolean {
  return (
    input.busy ||
    input.baseAssets.length === 0 ||
    (input.baseMode === "track" ? !input.trackId : !input.playlistId)
  );
}
