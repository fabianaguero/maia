import { useCallback, useEffect } from "react";

import {
  resolveLibraryMonitorGuideState,
  resolvePlaylistArmState,
  resolveSessionMonitorGuideState,
  resolveTrackArmState,
} from "../appRuntime";
import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type GuideActionsInput = Pick<
  UseAppMonitorActionsInput,
  "library" | "monitor"
>;

export function useAppMonitorGuideActions({
  library,
  monitor,
}: GuideActionsInput) {
  const armTrackBase = useCallback(
    (trackId: string | null | undefined) => {
      const nextState = resolveTrackArmState(trackId, library.tracks);
      library.setSelectedPlaylistId(nextState.selectedPlaylistId);
      library.setSelectedTrackId(nextState.selectedTrackId);
    },
    [library],
  );

  const armPlaylistBase = useCallback(
    (playlistId: string | null | undefined) => {
      const nextState = resolvePlaylistArmState(
        playlistId,
        library.playlists,
        library.tracks,
      );
      library.setSelectedPlaylistId(nextState.selectedPlaylistId);
      library.setSelectedTrackId(nextState.selectedTrackId);
    },
    [library],
  );

  useEffect(() => {
    const guideState = resolveLibraryMonitorGuideState({
      selectedPlaylist: library.selectedPlaylist,
      selectedTrack: library.selectedTrack,
      tracks: library.tracks,
    });

    if (guideState.playlistPaths) {
      monitor.setGuideTrackPlaylist(guideState.playlistPaths);
      return;
    }

    monitor.setGuideTrack(guideState.trackPath);
  }, [library.selectedPlaylist, library.selectedTrack, library.tracks, monitor]);

  const armSessionMusicalBase = useCallback(
    (draft?: SessionMonitorDraft) => {
      if (draft?.playlistId) {
        armPlaylistBase(draft.playlistId);
        return;
      }

      if (draft?.trackId) {
        armTrackBase(draft.trackId);
        return;
      }

      library.setSelectedPlaylistId(null);
      library.setSelectedTrackId(null);
    },
    [armPlaylistBase, armTrackBase, library],
  );

  const primeMonitorGuideTrack = useCallback(
    (draft?: SessionMonitorDraft) => {
      const guideState = resolveSessionMonitorGuideState(
        draft,
        library.playlists,
        library.tracks,
      );

      if (guideState.playlistPaths) {
        monitor.setGuideTrackPlaylist(guideState.playlistPaths);
        return;
      }

      monitor.setGuideTrack(guideState.trackPath);
    },
    [library.playlists, library.tracks, monitor],
  );

  return {
    armTrackBase,
    armPlaylistBase,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
  };
}
