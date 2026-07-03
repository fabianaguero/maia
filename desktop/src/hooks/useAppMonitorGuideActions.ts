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
import {
  buildAppMonitorLibraryGuideEffectInput,
  buildAppMonitorPlaylistArmInput,
  buildAppMonitorSessionArmInput,
  buildAppMonitorSessionGuideInput,
  buildAppMonitorTrackArmInput,
} from "./appMonitorGuideActionsHookRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type GuideActionsInput = Pick<UseAppMonitorActionsInput, "library" | "monitor">;

export function useAppMonitorGuideActions({ library, monitor }: GuideActionsInput) {
  const armTrackBase = useCallback(
    (trackId: string | null | undefined) => {
      const trackArmInput = buildAppMonitorTrackArmInput({ library, monitor }, trackId);
      const nextState = resolveTrackArmState(trackArmInput.trackId, trackArmInput.tracks);
      applyLibraryArmState(nextState, {
        setSelectedPlaylistId: trackArmInput.setSelectedPlaylistId,
        setSelectedTrackId: trackArmInput.setSelectedTrackId,
      });
    },
    [library, monitor],
  );

  const armPlaylistBase = useCallback(
    (playlistId: string | null | undefined) => {
      const playlistArmInput = buildAppMonitorPlaylistArmInput({ library, monitor }, playlistId);
      const nextState = resolvePlaylistArmState(
        playlistArmInput.playlistId,
        playlistArmInput.playlists,
        playlistArmInput.tracks,
      );
      applyLibraryArmState(nextState, {
        setSelectedPlaylistId: playlistArmInput.setSelectedPlaylistId,
        setSelectedTrackId: playlistArmInput.setSelectedTrackId,
      });
    },
    [library, monitor],
  );

  useEffect(() => {
    const libraryGuideInput = buildAppMonitorLibraryGuideEffectInput({ library, monitor });
    const guideState = resolveLibraryMonitorGuideState({
      selectedPlaylist: libraryGuideInput.selectedPlaylist,
      selectedTrack: libraryGuideInput.selectedTrack,
      tracks: libraryGuideInput.tracks,
    });

    applyMonitorGuideState(guideState, {
      setGuideTrack: libraryGuideInput.setGuideTrack,
      setGuideTrackPlaylist: libraryGuideInput.setGuideTrackPlaylist,
    });
  }, [library, monitor]);

  const armSessionMusicalBase = useCallback(
    (draft?: SessionMonitorDraft) => {
      const sessionArmInput = buildAppMonitorSessionArmInput(
        { library, monitor },
        draft,
        armPlaylistBase,
        armTrackBase,
      );

      if (sessionArmInput.draft?.playlistId) {
        sessionArmInput.armPlaylistBase(sessionArmInput.draft.playlistId);
        return;
      }

      if (sessionArmInput.draft?.trackId) {
        sessionArmInput.armTrackBase(sessionArmInput.draft.trackId);
        return;
      }

      clearLibraryArmState({
        setSelectedPlaylistId: sessionArmInput.setSelectedPlaylistId,
        setSelectedTrackId: sessionArmInput.setSelectedTrackId,
      });
    },
    [armPlaylistBase, armTrackBase, library, monitor],
  );

  const primeMonitorGuideTrack = useCallback(
    (draft?: SessionMonitorDraft) => {
      const sessionGuideInput = buildAppMonitorSessionGuideInput({ library, monitor }, draft);
      const guideState = resolveSessionMonitorGuideState(
        sessionGuideInput.draft,
        sessionGuideInput.playlists,
        sessionGuideInput.tracks,
      );
      applyMonitorGuideState(guideState, {
        setGuideTrack: sessionGuideInput.setGuideTrack,
        setGuideTrackPlaylist: sessionGuideInput.setGuideTrackPlaylist,
      });
    },
    [library, monitor],
  );

  return {
    armTrackBase,
    armPlaylistBase,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
  };
}
