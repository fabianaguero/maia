import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import { useT } from "../../i18n/I18nContext";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import { SessionCreateFooter } from "./SessionCreateFooter";
import { SessionSetupSelectionGrid } from "./SessionSetupSelectionGrid";
import { SessionTemplatePresetStrip } from "./SessionTemplatePresetStrip";
import { SessionWorkflowStrip } from "./SessionWorkflowStrip";
import {
  buildSessionCreateFooterProps,
  buildSessionSetupHeader,
  buildSessionSetupSelectionGridProps,
  buildSessionTemplatePresetStripProps,
  buildSessionWorkflowStripProps,
} from "./sessionSetupPanelRuntime";

interface SessionSetupPanelProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  sourceOptions: RepositoryAnalysis[];
  mode: QuickSessionMode;
  baseMode: SessionBaseMode;
  selectedTemplateId: string;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  sessionLabel: string;
  sessionLabelPlaceholder: string;
  creating: boolean;
  mutating: boolean;
  onTemplateSelect: (templateId: string) => void;
  onBaseModeChange: (mode: SessionBaseMode) => void;
  onTrackSelect: (trackId: string) => void;
  onPlaylistSelect: (playlistId: string) => void;
  onModeChange: (mode: QuickSessionMode) => void;
  onSourceSelect: (sourceId: string) => void;
  onSessionLabelChange: (value: string) => void;
  onCreateSession: () => void | Promise<void>;
}

export function SessionSetupPanel({
  tracks,
  playlists,
  sourceOptions,
  mode,
  baseMode,
  selectedTemplateId,
  selectedSourceId,
  selectedTrackId,
  selectedPlaylistId,
  selectedSource,
  selectedTrack,
  selectedPlaylist,
  selectedBaseLabel,
  selectedBaseDetail,
  sessionLabel,
  sessionLabelPlaceholder,
  creating,
  mutating,
  onTemplateSelect,
  onBaseModeChange,
  onTrackSelect,
  onPlaylistSelect,
  onModeChange,
  onSourceSelect,
  onSessionLabelChange,
  onCreateSession,
}: SessionSetupPanelProps) {
  const t = useT();
  const header = buildSessionSetupHeader({ t });
  const templateStripProps = buildSessionTemplatePresetStripProps({
    selectedTemplateId,
    onTemplateSelect,
  });
  const workflowProps = buildSessionWorkflowStripProps({
    baseMode,
    selectedTrackId,
    selectedPlaylistId,
    selectedSourceId,
  });
  const selectionGridProps = buildSessionSetupSelectionGridProps({
    tracks,
    playlists,
    sourceOptions,
    mode,
    baseMode,
    selectedSourceId,
    selectedTrackId,
    selectedPlaylistId,
    selectedSource,
    selectedTrack,
    selectedPlaylist,
    selectedBaseLabel,
    selectedBaseDetail,
    onBaseModeChange,
    onTrackSelect,
    onPlaylistSelect,
    onModeChange,
    onSourceSelect,
  });
  const createFooterProps = buildSessionCreateFooterProps({
    baseMode,
    selectedSourceId,
    selectedTrackId,
    selectedPlaylistId,
    selectedSourceTitle: selectedSource?.title ?? null,
    selectedBaseLabel,
    sessionLabel,
    sessionLabelPlaceholder,
    creating,
    mutating,
    onSessionLabelChange,
    onCreateSession,
  });

  return (
    <section className="panel session-form-panel">
      <div className="panel-header">
        <h3>{header.title}</h3>
        <p className="support-copy">{header.summary}</p>
      </div>

      <SessionTemplatePresetStrip {...templateStripProps} />

      <SessionWorkflowStrip {...workflowProps} />

      <SessionSetupSelectionGrid {...selectionGridProps} />

      <SessionCreateFooter {...createFooterProps} />
    </section>
  );
}
