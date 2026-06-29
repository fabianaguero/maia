import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import { useT } from "../../i18n/I18nContext";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import { SessionCreateFooter } from "./SessionCreateFooter";
import { SessionSetupSelectionGrid } from "./SessionSetupSelectionGrid";
import { SessionTemplatePresetStrip } from "./SessionTemplatePresetStrip";
import { SessionWorkflowStrip } from "./SessionWorkflowStrip";

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
  const baseReady =
    (baseMode === "track" && selectedTrackId) || (baseMode === "playlist" && selectedPlaylistId);

  return (
    <section className="panel session-form-panel">
      <div className="panel-header">
        <h3>{t.session.newSessionTitle}</h3>
        <p className="support-copy">{t.session.newSessionHelp}</p>
      </div>

      <SessionTemplatePresetStrip
        selectedTemplateId={selectedTemplateId}
        onTemplateSelect={onTemplateSelect}
      />

      <SessionWorkflowStrip
        baseReady={Boolean(baseReady)}
        sourceReady={Boolean(selectedSourceId)}
      />

      <SessionSetupSelectionGrid
        tracks={tracks}
        playlists={playlists}
        sourceOptions={sourceOptions}
        mode={mode}
        baseMode={baseMode}
        selectedSourceId={selectedSourceId}
        selectedTrackId={selectedTrackId}
        selectedPlaylistId={selectedPlaylistId}
        selectedSource={selectedSource}
        selectedTrack={selectedTrack}
        selectedPlaylist={selectedPlaylist}
        selectedBaseLabel={selectedBaseLabel}
        selectedBaseDetail={selectedBaseDetail}
        onBaseModeChange={onBaseModeChange}
        onTrackSelect={onTrackSelect}
        onPlaylistSelect={onPlaylistSelect}
        onModeChange={onModeChange}
        onSourceSelect={onSourceSelect}
      />

      <SessionCreateFooter
        baseMode={baseMode}
        selectedSourceId={selectedSourceId}
        selectedTrackId={selectedTrackId}
        selectedPlaylistId={selectedPlaylistId}
        selectedSourceTitle={selectedSource?.title ?? null}
        selectedBaseLabel={selectedBaseLabel}
        sessionLabel={sessionLabel}
        sessionLabelPlaceholder={sessionLabelPlaceholder}
        creating={creating}
        mutating={mutating}
        onSessionLabelChange={onSessionLabelChange}
        onCreateSession={onCreateSession}
      />
    </section>
  );
}
