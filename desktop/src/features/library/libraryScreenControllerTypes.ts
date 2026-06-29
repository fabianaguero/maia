import type { ReactNode } from "react";

import type { LibraryScreenProps } from "./libraryScreenTypes";

export interface LibraryToolbarAction {
  id: string;
  label: string;
  icon: ReactNode;
  className: string;
  onClick: () => void | Promise<void>;
}

export type LibraryScreenControllerInput = Pick<
  LibraryScreenProps,
  | "tracks"
  | "playlists"
  | "repositories"
  | "baseAssets"
  | "newlyImportedId"
  | "selectedTrackId"
  | "selectedPlaylistId"
  | "selectedRepositoryId"
  | "selectedBaseAssetId"
  | "activeTab"
  | "onTabChange"
  | "trackLoading"
  | "repositoryLoading"
  | "baseAssetLoading"
  | "trackError"
  | "repositoryError"
  | "baseAssetError"
  | "onImportTrack"
  | "onImportRepository"
  | "onImportBaseAsset"
  | "onReanalyzeTrack"
  | "onRelinkTrack"
  | "onRelinkMissingTracks"
  | "onReanalyzeRepository"
  | "onDeleteTrack"
  | "onDeleteRepository"
  | "onSeedDemo"
  | "onSavePlaylist"
  | "onDeletePlaylist"
  | "onSelectTrack"
  | "onSelectPlaylist"
  | "onSelectRepository"
  | "onSelectBaseAsset"
  | "onInspectTrack"
  | "onInspectRepository"
  | "onInspectBaseAsset"
>;
