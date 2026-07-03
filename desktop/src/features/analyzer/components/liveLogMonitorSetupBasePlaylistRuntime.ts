import type { ComponentProps } from "react";

import { type LiveLogMonitorBasePlaylistPanel } from "./LiveLogMonitorBasePlaylistPanel";
import {
  addTrackToLiveMonitorBasePlaylist,
  loadSavedLiveMonitorBasePlaylist,
  moveTrackWithinLiveMonitorBasePlaylist,
  removeTrackFromLiveMonitorBasePlaylist,
  renameLiveMonitorBasePlaylist,
} from "./liveLogMonitorPlaylistEditorRuntime";
import type { LiveLogMonitorSetupSectionInput } from "./liveLogMonitorSetupSectionTypes";

export function buildLiveLogMonitorBasePlaylistPanelProps(
  input: Pick<
    LiveLogMonitorSetupSectionInput,
    | "t"
    | "basePlaylist"
    | "pendingAddTrackId"
    | "pendingLoadPlaylistId"
    | "basePlaylistTrackOptions"
    | "savedPlaylistOptions"
    | "basePlaylistEditorItems"
    | "availablePlaylists"
    | "availableTracks"
    | "setBasePlaylist"
    | "setPendingAddTrackId"
    | "setPendingLoadPlaylistId"
  >,
): ComponentProps<typeof LiveLogMonitorBasePlaylistPanel> {
  return {
    playlistName: input.basePlaylist?.name ?? input.t.inspect.basePlaylist,
    labels: {
      title: input.t.inspect.baseListeningBedTitle,
      stableBedCopy: input.t.inspect.stableBedCopy,
      namePlaceholder: input.t.inspect.nameBasePlaylist,
      lost: input.t.library.lost.toUpperCase(),
      addBaseTrack: input.t.inspect.addBaseTrack,
      addAction: input.t.inspect.addAction,
      loadSavedPlaylist: input.t.inspect.loadSavedPlaylist,
      loadAction: input.t.inspect.loadAction,
      moveUp: (name) => input.t.inspect.moveUp.replace("{name}", name),
      moveDown: (name) => input.t.inspect.moveDown.replace("{name}", name),
      removeFromPlaylist: (name) => input.t.inspect.removeFromPlaylist.replace("{name}", name),
      intendedListeningBedHint: input.t.inspect.intendedListeningBedHint,
    },
    pendingAddTrackId: input.pendingAddTrackId,
    pendingLoadPlaylistId: input.pendingLoadPlaylistId,
    addTrackOptions: input.basePlaylistTrackOptions,
    savedPlaylistOptions: input.savedPlaylistOptions,
    playlistItems: input.basePlaylistEditorItems,
    onPlaylistNameChange: (value) =>
      input.setBasePlaylist((current) => renameLiveMonitorBasePlaylist(current, value)),
    onPendingAddTrackIdChange: input.setPendingAddTrackId,
    onPendingLoadPlaylistIdChange: input.setPendingLoadPlaylistId,
    onAddTrack: () => {
      if (!input.pendingAddTrackId) {
        return;
      }
      input.setBasePlaylist((current) =>
        addTrackToLiveMonitorBasePlaylist(current, input.pendingAddTrackId),
      );
      input.setPendingAddTrackId("");
    },
    onLoadPlaylist: () => {
      const nextPlaylist =
        input.availablePlaylists.find((playlist) => playlist.id === input.pendingLoadPlaylistId) ??
        null;
      if (!nextPlaylist) {
        return;
      }
      input.setBasePlaylist(loadSavedLiveMonitorBasePlaylist(nextPlaylist, input.availableTracks));
    },
    onMoveTrackUp: (trackId) =>
      input.setBasePlaylist((current) =>
        moveTrackWithinLiveMonitorBasePlaylist(current, trackId, "up"),
      ),
    onMoveTrackDown: (trackId) =>
      input.setBasePlaylist((current) =>
        moveTrackWithinLiveMonitorBasePlaylist(current, trackId, "down"),
      ),
    onRemoveTrack: (trackId) =>
      input.setBasePlaylist((current) => removeTrackFromLiveMonitorBasePlaylist(current, trackId)),
  };
}
