import { useCallback, useEffect } from "react";

import {
  resolveLibraryMonitorGuideState,
  resolvePlaylistArmState,
  resolveSessionMonitorGuideState,
  resolveTrackArmState,
} from "../appRuntime";
import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";
import {
  applyLibraryArmState,
  applyMonitorGuideState,
  clearLibraryArmState,
} from "./appMonitorGuideActionsRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type GuideActionsInput = Pick<UseAppMonitorActionsInput, "library" | "monitor">;

export function useAppMonitorGuideActions({ library, monitor }: GuideActionsInput) {
  const armTrackBase = useCallback(
    (trackId: string | null | undefined) => {
      const nextState = resolveTrackArmState(trackId, library.tracks);
      applyLibraryArmState(nextState, {
        setSelectedPlaylistId: library.setSelectedPlaylistId,
        setSelectedTrackId: library.setSelectedTrackId,
      });
    },
    [library.setSelectedPlaylistId, library.setSelectedTrackId, library.tracks],
  );

  const armPlaylistBase = useCallback(
    (playlistId: string | null | undefined) => {
      const nextState = resolvePlaylistArmState(playlistId, library.playlists, library.tracks);
      applyLibraryArmState(nextState, {
        setSelectedPlaylistId: library.setSelectedPlaylistId,
        setSelectedTrackId: library.setSelectedTrackId,
      });
    },
    [library.playlists, library.setSelectedPlaylistId, library.setSelectedTrackId, library.tracks],
  );

  useEffect(() => {
    const guideState = resolveLibraryMonitorGuideState({
      selectedPlaylist: library.selectedPlaylist,
      selectedTrack: library.selectedTrack,
      tracks: library.tracks,
    });

    applyMonitorGuideState(guideState, {
      setGuideTrack: monitor.setGuideTrack,
      setGuideTrackPlaylist: monitor.setGuideTrackPlaylist,
    });
  }, [
    library.selectedPlaylist,
    library.selectedTrack,
    library.tracks,
    monitor.setGuideTrack,
    monitor.setGuideTrackPlaylist,
  ]);

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

      clearLibraryArmState({
        setSelectedPlaylistId: library.setSelectedPlaylistId,
        setSelectedTrackId: library.setSelectedTrackId,
      });
    },
    [armPlaylistBase, armTrackBase, library.setSelectedPlaylistId, library.setSelectedTrackId],
  );

  const primeMonitorGuideTrack = useCallback(
    (draft?: SessionMonitorDraft) => {
      const guideState = resolveSessionMonitorGuideState(draft, library.playlists, library.tracks);
      applyMonitorGuideState(guideState, {
        setGuideTrack: monitor.setGuideTrack,
        setGuideTrackPlaylist: monitor.setGuideTrackPlaylist,
      });
    },
    [library.playlists, library.tracks, monitor.setGuideTrack, monitor.setGuideTrackPlaylist],
  );

  return {
    armTrackBase,
    armPlaylistBase,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
  };
}
