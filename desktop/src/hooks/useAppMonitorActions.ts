import { useCallback, useEffect } from "react";

import type { CreateSessionInput, PersistedSession } from "../api/sessions";
import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../types/library";
import type { StartSessionInput } from "../types/monitor";
import {
  resolveLibraryMonitorGuideState,
  resolvePlaylistArmState,
  resolveReplaySourceRepository,
  resolveSessionMonitorGuideState,
  resolveTrackArmState,
  shouldReuseActiveReplaySession,
} from "../appRuntime";
import {
  resolveMonitoredRepository,
  resolveReplayMonitorDraft,
  resolveSessionPersistenceAction,
  type SessionMonitorDraft,
} from "../appMonitorActionsRuntime";
import { resolveSessionRepository } from "../appContentRuntime";

interface UseAppMonitorActionsInput {
  t: {
    appShell: {
      replayUnavailableTitle: string;
      replayUnavailableBody: string;
    };
    session: {
      unnamedSession: string;
    };
  };
  library: {
    tracks: LibraryTrack[];
    playlists: BaseTrackPlaylist[];
    selectedTrack: LibraryTrack | null;
    selectedPlaylist: BaseTrackPlaylist | null;
    setSelectedTrackId: (trackId: string | null) => void;
    setSelectedPlaylistId: (playlistId: string | null) => void;
  };
  repositories: {
    repositories: RepositoryAnalysis[];
    setSelectedRepositoryId: (repositoryId: string | null) => void;
  };
  sessions: {
    sessions: PersistedSession[];
    setSelectedSessionId: (sessionId: string) => void;
    createSession: (input: CreateSessionInput) => Promise<PersistedSession | null>;
    clearError: () => void;
  };
  monitor: {
    session: {
      persistedSessionId: string | null;
      repoId: string;
    } | null;
    isPlayback: boolean;
    setGuideTrack: (path: string | null) => void;
    setGuideTrackPlaylist: (paths: string[]) => void;
    playbackSession: (input: {
      sessionId: string;
      label: string;
      sourcePath: string;
      repoId?: string | null;
    }) => Promise<boolean>;
    pausePlayback: () => void;
    seekPlaybackWindow: (replayWindowIndex: number) => void;
    startSession: (
      repo: RepositoryAnalysis,
      input: StartSessionInput,
      persistedSessionId?: string,
    ) => Promise<boolean>;
  };
  notify: (
    tone: "success" | "error" | "info",
    title: string,
    body: string,
  ) => void;
  setAnalysisMode: (mode: AnalyzerViewMode) => void;
  setScreen: (screen: AppScreen) => void;
  setPillar: (pillar: AppPillar) => void;
}

export function useAppMonitorActions({
  t,
  library,
  repositories,
  sessions,
  monitor,
  notify,
  setAnalysisMode,
  setScreen,
  setPillar,
}: UseAppMonitorActionsInput) {
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

  const startReplaySession = useCallback(
    async (session: PersistedSession, replayWindowIndex?: number): Promise<boolean> => {
      sessions.setSelectedSessionId(session.id);
      const draft = resolveReplayMonitorDraft(session);
      armSessionMusicalBase(draft);
      primeMonitorGuideTrack(draft);

      const sourceRepository = resolveReplaySourceRepository(
        session,
        repositories.repositories,
      );

      if (!sourceRepository) {
        notify("error", t.appShell.replayUnavailableTitle, t.appShell.replayUnavailableBody);
        return false;
      }

      repositories.setSelectedRepositoryId(sourceRepository.id);
      setAnalysisMode("repo");

      const alreadyActiveReplay = shouldReuseActiveReplaySession({
        currentPersistedSessionId: monitor.session?.persistedSessionId,
        isPlayback: monitor.isPlayback,
        replaySessionId: session.id,
      });

      const ok = alreadyActiveReplay
        ? true
        : await monitor.playbackSession({
            sessionId: session.id,
            label: session.label || t.session.unnamedSession,
            sourcePath: session.sourcePath || "",
            repoId: sourceRepository.id ?? session.sourceId,
          });

      if (!ok) {
        return false;
      }

      if (typeof replayWindowIndex === "number") {
        monitor.pausePlayback();
        monitor.seekPlaybackWindow(replayWindowIndex);
      }

      setAnalysisMode("repo");
      setScreen("inspect");
      return true;
    },
    [
      armSessionMusicalBase,
      monitor,
      notify,
      primeMonitorGuideTrack,
      repositories,
      sessions,
      setAnalysisMode,
      setScreen,
      t,
    ],
  );

  const startLiveSession = useCallback(
    async (
      input: StartSessionInput,
      persistedSessionId: string,
      draft?: SessionMonitorDraft & { sourceId?: string | null },
    ): Promise<boolean> => {
      sessions.clearError();
      armSessionMusicalBase({
        trackId: draft?.trackId,
        playlistId: draft?.playlistId,
      });
      primeMonitorGuideTrack({
        trackId: draft?.trackId,
        playlistId: draft?.playlistId,
      });

      const success = await monitor.startSession(
        resolveSessionRepository({
          adapterKind: input.adapterKind,
          label: input.label ?? t.session.unnamedSession,
          nowIso: new Date().toISOString(),
          repositories: repositories.repositories,
          sessionId: input.sessionId,
          source: input.source,
        }),
        input,
        persistedSessionId,
      );

      if (!success) {
        return false;
      }

      const persistenceAction = resolveSessionPersistenceAction({
        sessions: sessions.sessions,
        persistedSessionId,
      });

      if (persistenceAction === "create") {
        await sessions.createSession({
          id: persistedSessionId,
          label: input.label ?? undefined,
          sourceId: draft?.sourceId ?? undefined,
          trackId: draft?.trackId ?? undefined,
          playlistId: draft?.playlistId ?? undefined,
          adapterKind: input.adapterKind,
          mode: "live",
        });
      } else {
        sessions.setSelectedSessionId(persistedSessionId);
      }

      return true;
    },
    [
      armSessionMusicalBase,
      monitor,
      primeMonitorGuideTrack,
      repositories.repositories,
      sessions,
      t.session.unnamedSession,
    ],
  );

  const openMonitoredRepo = useCallback(() => {
    const repo = resolveMonitoredRepository(monitor.session, repositories.repositories);
    if (!repo) {
      return;
    }

    repositories.setSelectedRepositoryId(repo.id);
    setAnalysisMode("repo");
    setScreen("inspect");
    setPillar("curate");
  }, [monitor.session, repositories, setAnalysisMode, setPillar, setScreen]);

  return {
    armTrackBase,
    armPlaylistBase,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
    startReplaySession,
    startLiveSession,
    openMonitoredRepo,
  };
}
