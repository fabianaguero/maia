import { Plus } from "lucide-react";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import { useT } from "../../i18n/I18nContext";
import {
  SOURCE_TEMPLATES,
  resolveSourceTemplatePresentation,
  type SourceTemplate,
} from "../../config/sourceTemplates";
import { getPlaylistMedianBpm } from "../../utils/playlist";
import { getTrackTitle } from "../../utils/track";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";

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
  const selectedTemplate =
    SOURCE_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? null;
  const selectedTemplatePresentation = selectedTemplate
    ? resolveSourceTemplatePresentation(selectedTemplate, t)
    : null;
  const baseReady =
    (baseMode === "track" && selectedTrackId) || (baseMode === "playlist" && selectedPlaylistId);

  return (
    <section className="panel session-form-panel">
      <div className="panel-header">
        <h3>{t.session.newSessionTitle}</h3>
        <p className="support-copy">{t.session.newSessionHelp}</p>
      </div>

      <div className="source-templates">
        <span className="source-templates-label">{t.session.stylePreset}</span>
        <div className="source-template-list">
          {SOURCE_TEMPLATES.map((template: SourceTemplate) => {
            const presentation = resolveSourceTemplatePresentation(template, t);
            return (
              <button
                key={template.id}
                type="button"
                className={`source-template-card${selectedTemplateId === template.id ? " selected" : ""}`}
                onClick={() => onTemplateSelect(template.id)}
                title={presentation?.hint ?? template.hint}
              >
                <span className="source-template-icon">{template.icon}</span>
                <span className="source-template-name">
                  {presentation?.label ?? template.label}
                </span>
                <span className="source-template-bpm">{template.bpm} BPM</span>
                <span className="source-template-genre">
                  {presentation?.genre ?? template.genre}
                </span>
              </button>
            );
          })}
        </div>
        {selectedTemplate ? (
          <p className="source-template-hint">
            {selectedTemplatePresentation?.hint ?? selectedTemplate.hint}
          </p>
        ) : null}
      </div>

      <div className="workflow-strip" aria-hidden="true">
        <div className="workflow-step-wrap">
          <span className={`workflow-step${baseReady ? " active" : ""}`}>
            {t.session.workflowBase}
          </span>
          <span className="workflow-arrow">→</span>
        </div>
        <div className="workflow-step-wrap">
          <span className={`workflow-step${selectedSourceId ? " active" : ""}`}>
            {t.session.workflowSource}
          </span>
          <span className="workflow-arrow">→</span>
        </div>
        <div className="workflow-step-wrap">
          <span className="workflow-step active">{t.session.workflowName}</span>
          <span className="workflow-arrow">→</span>
        </div>
        <div className="workflow-step-wrap">
          <span className="workflow-step">{t.session.workflowRun}</span>
        </div>
      </div>

      <div className="monitor-setup-grid">
        <div className="audio-path-card monitor-setup-card">
          <span>{t.session.stepBaseTitle}</span>
          <p className="monitor-empty-hint">{t.session.stepBaseHelp}</p>

          <div className="session-mode-tabs">
            <button
              type="button"
              className={`session-mode-tab${baseMode === "track" ? " active" : ""}`}
              onClick={() => onBaseModeChange("track")}
              disabled={tracks.length === 0}
            >
              {t.session.track}
            </button>
            <button
              type="button"
              className={`session-mode-tab${baseMode === "playlist" ? " active" : ""}`}
              onClick={() => onBaseModeChange("playlist")}
              disabled={playlists.length === 0}
            >
              {t.session.playlist}
            </button>
          </div>

          {baseMode === "track" ? (
            tracks.length === 0 ? (
              <p className="placeholder">{t.session.noTracks}</p>
            ) : (
              <div className="session-asset-options">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    className={`session-asset-option${selectedTrackId === track.id ? " selected" : ""}`}
                    onClick={() => onTrackSelect(track.id)}
                  >
                    <span className="session-asset-title">{getTrackTitle(track)}</span>
                    <span className="session-asset-path">
                      {track.analysis.bpm?.toFixed(0) ?? "—"} BPM
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : playlists.length === 0 ? (
            <p className="placeholder">{t.session.noPlaylists}</p>
          ) : (
            <div className="session-asset-options">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  className={`session-asset-option${selectedPlaylistId === playlist.id ? " selected" : ""}`}
                  onClick={() => onPlaylistSelect(playlist.id)}
                >
                  <span className="session-asset-title">{playlist.name}</span>
                  <span className="session-asset-path">
                    {playlist.trackIds.length} {t.library.sounds.toLowerCase()} · {t.session.median}{" "}
                    {getPlaylistMedianBpm(playlist, tracks)?.toFixed(0) ?? "?"} BPM
                  </span>
                </button>
              ))}
            </div>
          )}

          {(selectedTrack || selectedPlaylist) && (
            <div className="monitor-source-summary">
              <small>{t.session.armed}</small>
              <strong>{selectedBaseLabel}</strong>
              <small style={{ marginTop: 4 }}>{selectedBaseDetail}</small>
            </div>
          )}
        </div>

        <div className="audio-path-card monitor-setup-card">
          <span>{t.session.stepSourceTitle}</span>
          <p className="monitor-empty-hint">{t.session.stepSourceHelp}</p>

          <div className="session-mode-tabs">
            <button
              type="button"
              className={`session-mode-tab${mode === "log" ? " active" : ""}`}
              onClick={() => onModeChange("log")}
            >
              {t.session.logFile}
            </button>
            <button
              type="button"
              className={`session-mode-tab${mode === "repo" ? " active" : ""}`}
              onClick={() => onModeChange("repo")}
            >
              {t.session.repository}
            </button>
          </div>

          {sourceOptions.length === 0 ? (
            <p className="placeholder">
              {mode === "log" ? t.session.noImportedLogs : t.session.noImportedRepos}
            </p>
          ) : (
            <div className="session-asset-options">
              {sourceOptions.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  className={`session-asset-option${selectedSourceId === source.id ? " selected" : ""}`}
                  onClick={() => onSourceSelect(source.id)}
                >
                  <span className="session-asset-title">{source.title}</span>
                  <span className="session-asset-path">{source.sourcePath}</span>
                </button>
              ))}
            </div>
          )}

          {selectedSource && (
            <div className="monitor-source-summary">
              <small>{t.session.selected}</small>
              <strong>{selectedSource.title}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="session-create-footer">
        <label className="field-label">{t.session.sessionName}</label>
        <input
          type="text"
          value={sessionLabel}
          onChange={(event) => onSessionLabelChange(event.target.value)}
          placeholder={sessionLabelPlaceholder}
          className="field-input"
        />

        <div className="monitor-readiness-list" role="list">
          <div className="monitor-readiness-item" role="listitem">
            <span>{t.session.baseBed}</span>
            <span className={`monitor-readiness-state${baseReady ? " ready" : ""}`}>
              {baseReady ? (selectedBaseLabel ?? t.session.armed) : t.session.notSelected}
            </span>
          </div>
          <div className="monitor-readiness-item" role="listitem">
            <span>{t.session.sourceFeed}</span>
            <span className={`monitor-readiness-state${selectedSource ? " ready" : ""}`}>
              {selectedSource ? selectedSource.title : t.session.notSelected}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="action"
          onClick={onCreateSession}
          disabled={
            creating ||
            mutating ||
            !selectedSourceId ||
            (baseMode === "track" ? !selectedTrackId : !selectedPlaylistId)
          }
        >
          <Plus size={14} />
          {t.session.runStepAction.replace("{label}", t.session.startSession)}
        </button>
      </div>
    </section>
  );
}
