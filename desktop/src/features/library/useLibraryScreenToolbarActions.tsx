import { useMemo, type Dispatch, type SetStateAction } from "react";

import { FolderOpen, ListMusic, Music, PackagePlus, Plus, Trash2, X } from "lucide-react";

import type { AppTranslations } from "../../i18n/en";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LibraryScreenViewModel } from "./libraryScreenViewModel";
import type { LibraryToolbarAction } from "./libraryScreenControllerTypes";
import type { LibraryTab } from "./libraryScreenTypes";
import {
  resolveRepositoryCleanupCandidates,
  resolveTrackCleanupCandidates,
} from "./libraryScreenToolbarRuntime";

interface UseLibraryScreenToolbarActionsInput {
  t: AppTranslations;
  tab: LibraryTab;
  showForm: boolean;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  viewModel: LibraryScreenViewModel;
  missingTrackCount: number;
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  openPlaylistEditor: () => void;
  onSeedDemo: () => Promise<void>;
  onRelinkMissingTracks: () => Promise<boolean>;
  onDeleteTrack: (trackId: string) => Promise<boolean>;
  onDeleteRepository: (repositoryId: string) => Promise<boolean>;
}

export function useLibraryScreenToolbarActions({
  t,
  tab,
  showForm,
  setShowForm,
  viewModel,
  missingTrackCount,
  tracks,
  repositories,
  openPlaylistEditor,
  onSeedDemo,
  onRelinkMissingTracks,
  onDeleteTrack,
  onDeleteRepository,
}: UseLibraryScreenToolbarActionsInput) {
  return useMemo<LibraryToolbarAction[]>(
    () => [
      {
        id: "toggle-form",
        label: showForm ? t.library.cancel : viewModel.toolbar.formToggleLabel,
        icon: showForm ? (
          <X size={14} />
        ) : tab === "tracks" ? (
          <Music size={14} />
        ) : tab === "sources" || tab === "connections" ? (
          <FolderOpen size={14} />
        ) : (
          <PackagePlus size={14} />
        ),
        className: showForm ? "action toolbar-action active" : "action toolbar-action",
        onClick: () => setShowForm((value) => !value),
      },
      ...(viewModel.toolbar.showSeedDemo
        ? [
            {
              id: "seed-demo",
              label: t.library.seedDemo,
              icon: <Plus size={14} />,
              className: "action toolbar-action",
              onClick: async () => {
                await onSeedDemo();
                setShowForm(false);
              },
            },
          ]
        : []),
      ...(viewModel.toolbar.showNewPlaylist
        ? [
            {
              id: "new-playlist",
              label: t.library.newPlaylist,
              icon: <ListMusic size={14} />,
              className: "secondary-action toolbar-action",
              onClick: () => openPlaylistEditor(),
            },
          ]
        : []),
      ...(viewModel.toolbar.showRelinkMissing
        ? [
            {
              id: "relink-missing",
              label: `${t.library.relinkMissing} (${missingTrackCount})`,
              icon: <FolderOpen size={14} />,
              className: "secondary-action toolbar-action",
              onClick: () => void onRelinkMissingTracks(),
            },
          ]
        : []),
      ...(tab === "tracks" && viewModel.toolbar.showCleanOrphans
        ? [
            {
              id: "clean-track-orphans",
              label: t.library.cleanOrphans,
              icon: <Trash2 size={14} />,
              className: "action action-secondary toolbar-action",
              onClick: async () => {
                const orphanTrackIds = resolveTrackCleanupCandidates(tracks);
                if (orphanTrackIds.length === 0) {
                  alert(t.library.noUnanalyzedTracks);
                  return;
                }
                if (
                  !confirm(
                    t.library.confirmDeleteTracks.replace("{count}", String(orphanTrackIds.length)),
                  )
                ) {
                  return;
                }
                for (const orphanTrackId of orphanTrackIds) {
                  await onDeleteTrack(orphanTrackId);
                }
              },
            },
          ]
        : []),
      ...(tab === "sources" && viewModel.toolbar.showCleanOrphans
        ? [
            {
              id: "clean-source-orphans",
              label: t.library.cleanOrphans,
              icon: <Trash2 size={14} />,
              className: "action action-secondary toolbar-action",
              onClick: async () => {
                const orphanRepositoryIds = resolveRepositoryCleanupCandidates(repositories);
                if (orphanRepositoryIds.length === 0) {
                  alert(t.library.noUnanalyzedSources);
                  return;
                }
                if (
                  !confirm(
                    t.library.confirmDeleteSources.replace(
                      "{count}",
                      String(orphanRepositoryIds.length),
                    ),
                  )
                ) {
                  return;
                }
                for (const orphanRepositoryId of orphanRepositoryIds) {
                  await onDeleteRepository(orphanRepositoryId);
                }
              },
            },
          ]
        : []),
    ],
    [
      missingTrackCount,
      onDeleteRepository,
      onDeleteTrack,
      onRelinkMissingTracks,
      onSeedDemo,
      openPlaylistEditor,
      repositories,
      setShowForm,
      showForm,
      t.library.cancel,
      t.library.cleanOrphans,
      t.library.confirmDeleteSources,
      t.library.confirmDeleteTracks,
      t.library.newPlaylist,
      t.library.noUnanalyzedSources,
      t.library.noUnanalyzedTracks,
      t.library.relinkMissing,
      t.library.seedDemo,
      tab,
      tracks,
      viewModel.toolbar.formToggleLabel,
      viewModel.toolbar.showCleanOrphans,
      viewModel.toolbar.showNewPlaylist,
      viewModel.toolbar.showRelinkMissing,
      viewModel.toolbar.showSeedDemo,
    ],
  );
}
