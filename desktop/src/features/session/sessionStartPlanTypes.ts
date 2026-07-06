export interface SessionStartDraft {
  sourceId?: string;
  trackId?: string;
  playlistId?: string;
}

export interface SessionScreenCopy {
  session: {
    directFeed: string;
    failedReplay: string;
    failedReplayJump: string;
    fileOnlyLiveBooth: string;
    noStoredSourceReplay: string;
    noStoredSourceResume: string;
    resumedSession: string;
    selectBasePlaylist: string;
    selectBaseTrack: string;
    selectLogSource: string;
    selectRepoSource: string;
    sourceNotFound: string;
    unsupportedAdapterResume: string;
  };
}
