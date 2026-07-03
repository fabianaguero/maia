import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { useT } from "../../../i18n/I18nContext";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  ImportCompositionInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";
import {
  buildImportCompositionInput,
  buildImportCompositionResetState,
  deriveDefaultBaseAssetId,
  resolveInitialCompositionBaseMode,
  resolveValidCompositionBaseMode,
  resolveValidCompositionSelection,
  type CompositionBaseMode,
  validateImportCompositionForm,
} from "./importCompositionFormRuntime";

interface UseImportCompositionFormControllerInput {
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
}

export function useImportCompositionFormController({
  baseAssets,
  tracks,
  playlists,
  repositories,
  onImportComposition,
}: UseImportCompositionFormControllerInput) {
  const t = useT();
  const [baseAssetId, setBaseAssetId] = useState(deriveDefaultBaseAssetId(baseAssets));
  const [baseMode, setBaseMode] = useState<CompositionBaseMode>(
    resolveInitialCompositionBaseMode({ tracks, playlists }),
  );
  const [trackId, setTrackId] = useState<string>(tracks[0]?.id ?? "");
  const [playlistId, setPlaylistId] = useState<string>(playlists[0]?.id ?? "");
  const [structureId, setStructureId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseAssets.some((entry) => entry.id === baseAssetId)) {
      setBaseAssetId(deriveDefaultBaseAssetId(baseAssets));
    }
  }, [baseAssets, baseAssetId]);

  useEffect(() => {
    setTrackId((current) => resolveValidCompositionSelection(current, tracks));
  }, [tracks]);

  useEffect(() => {
    setPlaylistId((current) => resolveValidCompositionSelection(current, playlists));
  }, [playlists]);

  useEffect(() => {
    setBaseMode((current) =>
      resolveValidCompositionBaseMode({
        baseMode: current,
        tracks,
        playlists,
      }),
    );
  }, [playlists, tracks]);

  useEffect(() => {
    if (structureId && !repositories.some((entry) => entry.id === structureId)) {
      setStructureId("");
    }
  }, [structureId, repositories]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateImportCompositionForm({
      t,
      baseAssetId,
      baseMode,
      trackId,
      playlistId,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const imported = await onImportComposition(
      buildImportCompositionInput({
        baseAssetId,
        baseMode,
        trackId,
        playlistId,
        structureId,
        label,
      }),
    );

    if (imported) {
      const resetState = buildImportCompositionResetState();
      setLabel(resetState.label);
    }
  }

  return {
    t,
    baseAssetId,
    setBaseAssetId,
    baseMode,
    setBaseMode,
    trackId,
    setTrackId,
    playlistId,
    setPlaylistId,
    structureId,
    setStructureId,
    label,
    setLabel,
    error,
    selectedBaseAsset: baseAssets.find((entry) => entry.id === baseAssetId) ?? null,
    selectedTrack: tracks.find((entry) => entry.id === trackId) ?? null,
    selectedPlaylist: playlists.find((entry) => entry.id === playlistId) ?? null,
    selectedStructure: structureId
      ? (repositories.find((entry) => entry.id === structureId) ?? null)
      : null,
    handleSubmit,
  };
}
