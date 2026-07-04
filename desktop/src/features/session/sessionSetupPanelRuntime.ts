import type { ComponentProps } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { SessionCreateFooter } from "./SessionCreateFooter";
import type { SessionSetupSelectionGrid } from "./SessionSetupSelectionGrid";
import type { SessionTemplatePresetStrip } from "./SessionTemplatePresetStrip";
import type { SessionWorkflowStrip } from "./SessionWorkflowStrip";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";

export function resolveSessionSetupBaseReady(input: {
  baseMode: SessionBaseMode;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
}): boolean {
  return Boolean(
    (input.baseMode === "track" && input.selectedTrackId) ||
      (input.baseMode === "playlist" && input.selectedPlaylistId),
  );
}

export function buildSessionSetupHeader(input: { t: AppTranslations }) {
  return {
    title: input.t.session.newSessionTitle,
    summary: input.t.session.newSessionHelp,
  };
}

export function buildSessionTemplatePresetStripProps(input: {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}): ComponentProps<typeof SessionTemplatePresetStrip> {
  return input;
}

export function buildSessionWorkflowStripProps(input: {
  baseMode: SessionBaseMode;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
}): ComponentProps<typeof SessionWorkflowStrip> {
  return {
    baseReady: resolveSessionSetupBaseReady(input),
    sourceReady: Boolean(input.selectedSourceId),
  };
}

export function buildSessionSetupSelectionGridProps(input: {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  sourceOptions: RepositoryAnalysis[];
  mode: QuickSessionMode;
  baseMode: SessionBaseMode;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  onBaseModeChange: (mode: SessionBaseMode) => void;
  onTrackSelect: (trackId: string) => void;
  onPlaylistSelect: (playlistId: string) => void;
  onModeChange: (mode: QuickSessionMode) => void;
  onSourceSelect: (sourceId: string) => void;
}): ComponentProps<typeof SessionSetupSelectionGrid> {
  return input;
}

export function buildSessionCreateFooterProps(input: {
  baseMode: SessionBaseMode;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSourceTitle: string | null;
  selectedBaseLabel: string | null;
  sessionLabel: string;
  sessionLabelPlaceholder: string;
  creating: boolean;
  mutating: boolean;
  onSessionLabelChange: (value: string) => void;
  onCreateSession: () => void | Promise<void>;
}): ComponentProps<typeof SessionCreateFooter> {
  return input;
}
