import type { LibraryTrack } from "../../../types/library";
import { buildNowPlayingSummary, buildUpNextSummary } from "./liveLogMonitorPlaylistViewState";

export function buildLiveLogMonitorPanelPlaylistSummaries(input: {
  backgroundNowPlayingTrack: LibraryTrack | null;
  backgroundTransitionNextTrack: LibraryTrack | null;
  transitionSummary: string | null;
  liveEnabled: boolean;
  nowPlayingLabel: string;
  upNextLabel: string;
}) {
  return {
    nowPlayingSummary: buildNowPlayingSummary(
      input.liveEnabled,
      input.backgroundNowPlayingTrack,
      input.nowPlayingLabel,
    ),
    upNextSummary: buildUpNextSummary(
      input.liveEnabled,
      input.backgroundTransitionNextTrack,
      input.transitionSummary,
      input.upNextLabel,
    ),
  };
}
