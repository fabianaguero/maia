import type { BaseTrackPlaylist, LibraryTrack } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import { resolvePlaylistTracks } from "../../../utils/playlist";
import { getTrackTitle, resolvePlayableTrackPath } from "../../../utils/track";
import { blendAnchors, deriveReferenceAnchor, type ReferenceAnchor } from "./liveSonificationScene";

function resolveReferenceAnchor(
  basePlaylist: BaseTrackPlaylist | null,
  availableTracks: LibraryTrack[],
): ReferenceAnchor | null {
  const anchors = (basePlaylist?.trackIds ?? [])
    .map((id) => availableTracks.find((track) => track.id === id))
    .filter((track): track is LibraryTrack => track !== undefined)
    .map(deriveReferenceAnchor);

  return anchors.length > 0 ? blendAnchors(anchors) : null;
}

export interface BuildLiveLogMonitorTrackSelectionStateInput {
  basePlaylist: BaseTrackPlaylist | null;
  availableTracks: LibraryTrack[];
  backgroundNowPlayingId: string | null;
  backgroundTransitionPlan: PlaylistTransitionPlan | null;
}

export function buildLiveLogMonitorTrackSelectionState(
  input: BuildLiveLogMonitorTrackSelectionStateInput,
) {
  const playableBaseTracks = resolvePlaylistTracks(
    input.basePlaylist,
    input.availableTracks,
  ).filter((track) => Boolean(resolvePlayableTrackPath(track)));
  const availableBaseTrackOptions = input.availableTracks
    .filter((track) => !(input.basePlaylist?.trackIds ?? []).includes(track.id))
    .sort((left, right) => {
      const leftMissing = left.file.availabilityState === "missing" ? 1 : 0;
      const rightMissing = right.file.availabilityState === "missing" ? 1 : 0;
      if (leftMissing !== rightMissing) {
        return leftMissing - rightMissing;
      }

      return getTrackTitle(left).localeCompare(getTrackTitle(right));
    });
  const playableBaseTrackIdsKey = playableBaseTracks.map((track) => track.id).join("|");
  const backgroundNowPlayingTrack = input.backgroundNowPlayingId
    ? (input.availableTracks.find((track) => track.id === input.backgroundNowPlayingId) ?? null)
    : null;
  const backgroundTransitionNextTrack = input.backgroundTransitionPlan?.nextTrackId
    ? (input.availableTracks.find(
        (track) => track.id === input.backgroundTransitionPlan?.nextTrackId,
      ) ?? null)
    : null;
  const traceWaveformTrack = backgroundNowPlayingTrack ?? playableBaseTracks[0] ?? null;
  const referenceAnchor = resolveReferenceAnchor(input.basePlaylist, input.availableTracks);
  const baseTrackCount = input.basePlaylist?.trackIds.length ?? 0;
  const hasBaseListeningBed = baseTrackCount > 0;

  return {
    playableBaseTracks,
    availableBaseTrackOptions,
    playableBaseTrackIdsKey,
    backgroundNowPlayingTrack,
    backgroundTransitionNextTrack,
    traceWaveformTrack,
    referenceAnchor,
    baseTrackCount,
    hasBaseListeningBed,
  };
}
