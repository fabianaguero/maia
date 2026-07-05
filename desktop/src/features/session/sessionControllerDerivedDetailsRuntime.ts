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

export interface SessionControllerDerivedDetailsInput {
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
}

export function buildSessionControllerSelectedBaseDetails(
  input: Pick<
    SessionControllerDerivedDetailsInput,
    "baseMode" | "selectedTrack" | "selectedPlaylist" | "tracks"
  >,
): SessionDetailSummary {
  return resolveSelectedBaseDetails(
    input.baseMode,
    input.selectedTrack,
    input.selectedPlaylist,
    input.tracks,
  );
}

export function buildSessionControllerLabelPlaceholder(input: {
  selectedBaseDetails: SessionDetailSummary;
  selectedSource: RepositoryAnalysis | null;
  templateGenre: string | null;
  templateLabel: string | null;
  sessionPlaceholderFallback: string;
}): string {
  return buildSessionLabelPlaceholder({
    selectedBaseLabel: input.selectedBaseDetails.label,
    selectedSourceTitle: input.selectedSource?.title ?? null,
    templateGenre: input.templateGenre,
    templateLabel: input.templateLabel,
    fallbackLabel: input.sessionPlaceholderFallback,
  });
}

export function buildSessionControllerLaunchState(
  input: Pick<
    SessionControllerDerivedDetailsInput,
    | "activePlaybackProgress"
    | "baseMode"
    | "selectedPlaylistId"
    | "selectedSourceId"
    | "selectedTrackId"
  >,
) {
  return {
    playbackPercent: resolvePlaybackPercent(input.activePlaybackProgress),
    readyToRun: resolveReadyToRun({
      baseMode: input.baseMode,
      selectedPlaylistId: input.selectedPlaylistId,
      selectedSourceId: input.selectedSourceId,
      selectedTrackId: input.selectedTrackId,
    }),
  };
}

export function buildSessionControllerSessionDetails(
  input: Pick<
    SessionControllerDerivedDetailsInput,
    "activeSession" | "selectedSession" | "tracks" | "playlists"
  >,
) {
  return {
    activeBaseDetails: resolveBaseDetails(input.activeSession, input.tracks, input.playlists),
    selectedSessionBaseDetails: resolveBaseDetails(
      input.selectedSession,
      input.tracks,
      input.playlists,
    ),
  };
}

export function buildSessionControllerSourceDetails(
  input: Pick<
    SessionControllerDerivedDetailsInput,
    "activeSession" | "selectedSession" | "repositories"
  >,
) {
  return {
    activeSourceDetails: resolveSourceDetails(input.activeSession, input.repositories),
    selectedSessionSourceDetails: resolveSourceDetails(input.selectedSession, input.repositories),
  };
}

export function resolveSessionControllerDerivedDetails(
  input: SessionControllerDerivedDetailsInput,
): SessionControllerDerivedDetailsState {
  const selectedBaseDetails = buildSessionControllerSelectedBaseDetails(input);
  const launchState = buildSessionControllerLaunchState(input);
  const sessionDetails = buildSessionControllerSessionDetails(input);
  const sourceDetails = buildSessionControllerSourceDetails(input);

  return {
    selectedBaseDetails,
    sessionLabelPlaceholder: buildSessionControllerLabelPlaceholder({
      selectedBaseDetails,
      selectedSource: input.selectedSource,
      templateGenre: input.templateGenre,
      templateLabel: input.templateLabel,
      sessionPlaceholderFallback: input.sessionPlaceholderFallback,
    }),
    playbackPercent: launchState.playbackPercent,
    readyToRun: launchState.readyToRun,
    activeBaseDetails: sessionDetails.activeBaseDetails,
    selectedSessionBaseDetails: sessionDetails.selectedSessionBaseDetails,
    activeSourceDetails: sourceDetails.activeSourceDetails,
    selectedSessionSourceDetails: sourceDetails.selectedSessionSourceDetails,
  };
}
