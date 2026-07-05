import {
  resolveSessionControllerDerivedDetails,
  type SessionControllerDerivedDetailsInput as SessionControllerDerivedDetailsResolverInput,
  type SessionControllerDerivedDetailsState,
  type SessionDetailSummary,
  type SessionSourceSummary,
} from "./sessionControllerDerivedDetailsRuntime";
import {
  resolveSelectedEntities,
  resolveSessionBookmarkState,
  resolveSessionSelection,
  resolveSourceOptions,
  type SessionEntitySelection,
  type SessionResolvedSelection,
} from "./sessionControllerDerivedSelectionRuntime";
import type {
  SessionControllerDerivedBookmarkState,
  SessionControllerDerivedBookmarkBindings,
  SessionControllerDerivedBookmarkInput,
  SessionControllerDerivedDetailsBindings,
  SessionControllerDerivedDetailsInput,
  SessionControllerDerivedSectionInputs,
  SessionControllerDerivedSections,
  SessionControllerDerivedSectionsInput,
  SessionControllerDerivedSelectionArgs,
  SessionControllerDerivedSelectionBindings,
  SessionControllerDerivedSelectionInput,
  SessionControllerDerivedSelectionState,
  SessionControllerDerivedSessionBindings,
  SessionControllerDerivedState,
  SessionControllerDerivedInput,
} from "./sessionControllerDerivedContracts";

export {
  resolveSelectedEntities,
  resolveSessionBookmarkState,
  resolveSessionSelection,
  resolveSourceOptions,
};
export type { SessionEntitySelection, SessionResolvedSelection };
export type { SessionDetailSummary, SessionSourceSummary };
export type {
  SessionControllerDerivedBookmarkBindings,
  SessionControllerDerivedBookmarkState,
  SessionControllerDerivedDetailsBindings,
  SessionControllerDerivedInput,
  SessionControllerDerivedSections,
  SessionControllerDerivedSelectionArgs,
  SessionControllerDerivedSelectionBindings,
  SessionControllerDerivedSelectionState,
  SessionControllerDerivedSessionBindings,
  SessionControllerDerivedState,
};

export function buildSessionControllerDerivedSelectionState(
  input: SessionControllerDerivedSelectionArgs,
): SessionControllerDerivedSelectionState {
  return {
    sourceOptions: input.sourceOptions,
    selectedSource: input.entitySelection.selectedSource,
    selectedTrack: input.entitySelection.selectedTrack,
    selectedPlaylist: input.entitySelection.selectedPlaylist,
    sessionSelection: input.sessionSelection,
  };
}

export function buildSessionControllerDerivedBookmarkInput(
  input: SessionControllerDerivedBookmarkInput,
) {
  return input;
}

export function buildSessionControllerDerivedBookmarkState(
  input: SessionControllerDerivedBookmarkInput,
): SessionControllerDerivedBookmarkState {
  return resolveSessionBookmarkState(input);
}

export function buildSessionControllerDerivedDetailsInput(
  input: SessionControllerDerivedDetailsInput,
) {
  return input;
}

export function buildSessionControllerDerivedDetailsState(
  input: SessionControllerDerivedDetailsResolverInput,
): SessionControllerDerivedDetailsState {
  return resolveSessionControllerDerivedDetails(input);
}

export function buildSessionControllerDerivedSelectionInput(
  input: SessionControllerDerivedInput,
): SessionControllerDerivedSelectionInput {
  return {
    mode: input.mode,
    repositories: input.repositories,
    playlists: input.playlists,
    selectedPlaylistId: input.selectedPlaylistId,
    selectedSourceId: input.selectedSourceId,
    selectedTrackId: input.selectedTrackId,
    tracks: input.tracks,
    sessions: input.sessions,
    activeSessionId: input.activeSessionId,
    selectedSessionId: input.selectedSessionId,
    activeSessionMode: input.activeSessionMode,
    monitorHasSession: input.monitorHasSession,
  };
}

export function buildSessionControllerDerivedSelectionArgs(
  input: SessionControllerDerivedSelectionInput,
): SessionControllerDerivedSelectionArgs {
  return {
    sourceOptions: resolveSourceOptions(input.mode, input.repositories),
    entitySelection: resolveSelectedEntities({
      playlists: input.playlists,
      repositories: input.repositories,
      selectedPlaylistId: input.selectedPlaylistId,
      selectedSourceId: input.selectedSourceId,
      selectedTrackId: input.selectedTrackId,
      tracks: input.tracks,
    }),
    sessionSelection: resolveSessionSelection({
      sessions: input.sessions,
      activeSessionId: input.activeSessionId,
      selectedSessionId: input.selectedSessionId,
      activeSessionMode: input.activeSessionMode,
      monitorHasSession: input.monitorHasSession,
      tracks: input.tracks,
      playlists: input.playlists,
    }),
  };
}

export function resolveSessionControllerDerivedSelectionState(
  input: SessionControllerDerivedInput,
): SessionControllerDerivedSelectionState {
  return buildSessionControllerDerivedSelectionState(
    buildSessionControllerDerivedSelectionArgs(buildSessionControllerDerivedSelectionInput(input)),
  );
}

export function resolveSessionControllerDerivedSections(input: SessionControllerDerivedInput) {
  const selectionState = resolveSessionControllerDerivedSelectionState(input);

  return buildSessionControllerDerivedSections({
    input,
    selectionState,
  });
}

export function buildSessionControllerDerivedSectionInputs(
  input: SessionControllerDerivedSectionsInput,
): SessionControllerDerivedSectionInputs {
  return {
    bookmarkInput: buildSessionControllerDerivedBookmarkInput({
      selectedSession: input.selectionState.sessionSelection.selectedSession,
      sessionBookmarksBySessionId: input.input.sessionBookmarksBySessionId,
      selectedSessionEvents: input.input.selectedSessionEvents,
    }),
    detailsInput: buildSessionControllerDerivedDetailsInput({
      baseMode: input.input.baseMode,
      selectedTrack: input.selectionState.selectedTrack,
      selectedPlaylist: input.selectionState.selectedPlaylist,
      tracks: input.input.tracks,
      selectedPlaylistId: input.input.selectedPlaylistId,
      selectedSourceId: input.input.selectedSourceId,
      selectedTrackId: input.input.selectedTrackId,
      selectedSource: input.selectionState.selectedSource,
      templateGenre: input.input.templateGenre,
      templateLabel: input.input.templateLabel,
      sessionPlaceholderFallback: input.input.sessionPlaceholderFallback,
      activePlaybackProgress: input.input.activePlaybackProgress,
      activeSession: input.selectionState.sessionSelection.activeSession,
      selectedSession: input.selectionState.sessionSelection.selectedSession,
      repositories: input.input.repositories,
      playlists: input.input.playlists,
    }),
  };
}

export function buildSessionControllerDerivedSections(
  input: SessionControllerDerivedSectionsInput,
): SessionControllerDerivedSections {
  const sectionInputs = buildSessionControllerDerivedSectionInputs(input);
  const bookmarkState = buildSessionControllerDerivedBookmarkState(sectionInputs.bookmarkInput);
  const detailsState = buildSessionControllerDerivedDetailsState(sectionInputs.detailsInput);

  return {
    selectionState: input.selectionState,
    bookmarkState,
    detailsState,
  };
}

export function buildSessionControllerDerivedSelectionBindings(
  input: SessionControllerDerivedSelectionState,
): SessionControllerDerivedSelectionBindings {
  return {
    sourceOptions: input.sourceOptions,
    selectedSource: input.selectedSource,
    selectedTrack: input.selectedTrack,
    selectedPlaylist: input.selectedPlaylist,
  };
}

export function buildSessionControllerDerivedSessionBindings(
  input: SessionControllerDerivedSelectionState,
): SessionControllerDerivedSessionBindings {
  return {
    activeSession: input.sessionSelection.activeSession,
    selectedSession: input.sessionSelection.selectedSession,
    selectedSessionIdForEvents: input.sessionSelection.selectedSessionIdForEvents,
    playbackActive: input.sessionSelection.playbackActive,
    liveMonitorActive: input.sessionSelection.liveMonitorActive,
    activeBedUrl: input.sessionSelection.activeBedUrl,
  };
}

export function buildSessionControllerDerivedBookmarkBindings(
  input: SessionControllerDerivedBookmarkState,
): SessionControllerDerivedBookmarkBindings {
  return {
    selectedSessionBookmarks: input.selectedSessionBookmarks,
    bookmarkContexts: input.bookmarkContexts,
  };
}

export function buildSessionControllerDerivedDetailsBindings(
  input: SessionControllerDerivedDetailsState,
): SessionControllerDerivedDetailsBindings {
  return {
    selectedBaseDetails: input.selectedBaseDetails,
    sessionLabelPlaceholder: input.sessionLabelPlaceholder,
    playbackPercent: input.playbackPercent,
    readyToRun: input.readyToRun,
    activeBaseDetails: input.activeBaseDetails,
    selectedSessionBaseDetails: input.selectedSessionBaseDetails,
    activeSourceDetails: input.activeSourceDetails,
    selectedSessionSourceDetails: input.selectedSessionSourceDetails,
  };
}

export function buildSessionControllerDerivedState(
  input: SessionControllerDerivedSections,
): SessionControllerDerivedState {
  return {
    ...buildSessionControllerDerivedSelectionBindings(input.selectionState),
    ...buildSessionControllerDerivedSessionBindings(input.selectionState),
    ...buildSessionControllerDerivedBookmarkBindings(input.bookmarkState),
    ...buildSessionControllerDerivedDetailsBindings(input.detailsState),
  };
}

export function resolveSessionControllerDerivedState(
  input: SessionControllerDerivedInput,
): SessionControllerDerivedState {
  return buildSessionControllerDerivedState(resolveSessionControllerDerivedSections(input));
}
