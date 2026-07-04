import type { PersistedSession } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import {
  resolveBaseDetails,
  resolveSelectedBaseDetails,
  resolveSourceDetails,
} from "./sessionDisplay";
import {
  buildSessionLabelPlaceholder,
  resolvePlaybackPercent,
  resolveReadyToRun,
} from "./sessionStartPlanRuntime";

export interface SessionDetailSummary {
  label: string | null;
  detail: string | null;
}

export interface SessionSourceSummary {
  label: string | null;
  path: string | null;
}

export interface SessionControllerDerivedDetailsState {
  selectedBaseDetails: SessionDetailSummary;
  sessionLabelPlaceholder: string;
  playbackPercent: number | null;
  readyToRun: boolean;
  activeBaseDetails: SessionDetailSummary;
  selectedSessionBaseDetails: SessionDetailSummary;
  activeSourceDetails: SessionSourceSummary;
  selectedSessionSourceDetails: SessionSourceSummary;
}

export function resolveSessionControllerDerivedDetails(input: {
  baseMode: "track" | "playlist";
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  tracks: LibraryTrack[];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedSource: RepositoryAnalysis | null;
  templateGenre: string | null;
  templateLabel: string | null;
  sessionPlaceholderFallback: string;
  activePlaybackProgress: number | null;
  activeSession: PersistedSession | null;
  selectedSession: PersistedSession | null;
  repositories: RepositoryAnalysis[];
  playlists: BaseTrackPlaylist[];
}): SessionControllerDerivedDetailsState {
  const selectedBaseDetails = resolveSelectedBaseDetails(
    input.baseMode,
    input.selectedTrack,
    input.selectedPlaylist,
    input.tracks,
  );

  return {
    selectedBaseDetails,
    sessionLabelPlaceholder: buildSessionLabelPlaceholder({
      selectedBaseLabel: selectedBaseDetails.label,
      selectedSourceTitle: input.selectedSource?.title ?? null,
      templateGenre: input.templateGenre,
      templateLabel: input.templateLabel,
      fallbackLabel: input.sessionPlaceholderFallback,
    }),
    playbackPercent: resolvePlaybackPercent(input.activePlaybackProgress),
    readyToRun: resolveReadyToRun({
      baseMode: input.baseMode,
      selectedPlaylistId: input.selectedPlaylistId,
      selectedSourceId: input.selectedSourceId,
      selectedTrackId: input.selectedTrackId,
    }),
    activeBaseDetails: resolveBaseDetails(input.activeSession, input.tracks, input.playlists),
    selectedSessionBaseDetails: resolveBaseDetails(
      input.selectedSession,
      input.tracks,
      input.playlists,
    ),
    activeSourceDetails: resolveSourceDetails(input.activeSession, input.repositories),
    selectedSessionSourceDetails: resolveSourceDetails(
      input.selectedSession,
      input.repositories,
    ),
  };
}
