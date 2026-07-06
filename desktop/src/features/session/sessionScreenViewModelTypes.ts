import type { SessionBookmark } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack } from "../../types/library";
import type { ComponentProps } from "react";

import type { SessionBoothPanel } from "./SessionBoothPanel";
import type { SessionScreenHeader } from "./SessionScreenHeader";
import type { SessionScreenNoticeStack } from "./SessionScreenNoticeStack";
import type { SessionScreenPanels } from "./SessionScreenPanels";
import type { useSessionScreenController } from "./useSessionScreenController";

export type SessionScreenControllerValue = ReturnType<typeof useSessionScreenController>;

export interface BuildSessionScreenViewModelInput {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  sessions: ComponentProps<typeof SessionScreenPanels>["sessions"];
  sessionsCount: number;
  selectedSessionId: string | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  onStopSession: () => Promise<void>;
  onDelete: (sessionId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
  controller: SessionScreenControllerValue;
}

export interface SessionScreenViewModel {
  headerProps: ComponentProps<typeof SessionScreenHeader>;
  noticeProps: ComponentProps<typeof SessionScreenNoticeStack>;
  boothProps: ComponentProps<typeof SessionBoothPanel>;
  panelsProps: ComponentProps<typeof SessionScreenPanels>;
}
