import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  ImportCompositionInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";
import { getPlaylistMedianBpm, summarizePlaylistTracks } from "../../../utils/playlist";
import { getTrackTitle } from "../../../utils/track";
import { resolveImportCompositionSubmitDisabled } from "./importCompositionFormRuntime";
import { useImportCompositionFormController } from "./useImportCompositionFormController";

interface ImportCompositionFormProps {
  busy: boolean;
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
}

export function ImportCompositionForm({
  busy,
  baseAssets,
  tracks,
  playlists,
  repositories,
  onImportComposition,
}: ImportCompositionFormProps) {
  const {
    t,
    baseAssetId,
    setBaseAssetId,
    baseMode,
    setBaseMode,
    trackId,
    setTrackId,
    playlistId,
    setPlaylistId,
    structureId,
    setStructureId,
    label,
    setLabel,
    error,
    selectedBaseAsset,
    selectedTrack,
    selectedPlaylist,
    selectedStructure,
    handleSubmit,
  } = useImportCompositionFormController({
    baseAssets,
    tracks,
    playlists,
    repositories,
    onImportComposition,
  });
  const selectedPlaylistBpm = getPlaylistMedianBpm(selectedPlaylist, tracks);

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>{t.compose.forms.title}</h2>
          <p className="support-copy">{t.compose.forms.description}</p>
        </div>
      </div>

      <label className="field">
        <span>{t.compose.forms.baseAsset}</span>
        <select
          value={baseAssetId}
          onChange={(event) => setBaseAssetId(event.target.value)}
          disabled={busy || baseAssets.length === 0}
        >
          {baseAssets.map((baseAsset) => (
            <option key={baseAsset.id} value={baseAsset.id}>
              {baseAsset.title} · {baseAsset.categoryLabel}
            </option>
          ))}
        </select>
      </label>

      {selectedBaseAsset ? (
        <div className="style-preview">
          <strong>{selectedBaseAsset.title}</strong>
          <p>
            {selectedBaseAsset.categoryLabel} · {selectedBaseAsset.entryCount} entries ·{" "}
            {selectedBaseAsset.reusable ? t.compose.forms.reusable : t.compose.forms.singleUse}
          </p>
        </div>
      ) : null}

      <div className="session-mode-tabs">
        <button
          type="button"
          className={`session-mode-tab${baseMode === "track" ? " active" : ""}`}
          onClick={() => setBaseMode("track")}
          disabled={busy || tracks.length === 0}
        >
          {t.compose.forms.baseTrack}
        </button>
        <button
          type="button"
          className={`session-mode-tab${baseMode === "playlist" ? " active" : ""}`}
          onClick={() => setBaseMode("playlist")}
          disabled={busy || playlists.length === 0}
        >
          {t.compose.forms.basePlaylist}
        </button>
      </div>

      {baseMode === "track" ? (
        <>
          <label className="field">
            <span>{t.compose.forms.trackLabel}</span>
            <select
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
              disabled={busy || tracks.length === 0}
            >
              <option value="">{t.compose.forms.trackPlaceholder}</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {getTrackTitle(track)} · {track.analysis.bpm?.toFixed(0) ?? t.library.noBpm} BPM
                </option>
              ))}
            </select>
          </label>

          {selectedTrack ? (
            <div className="style-preview">
              <strong>{selectedTrack.tags.title}</strong>
              <p>
                {t.compose.forms.trackPreview.replace(
                  "{bpm}",
                  selectedTrack.analysis.bpm?.toFixed(0) ?? "?",
                )}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <label className="field">
            <span>{t.compose.forms.playlistLabel}</span>
            <select
              value={playlistId}
              onChange={(event) => setPlaylistId(event.target.value)}
              disabled={busy || playlists.length === 0}
            >
              <option value="">{t.compose.forms.playlistPlaceholder}</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name} · {playlist.trackIds.length} {t.compose.forms.tracks}
                </option>
              ))}
            </select>
          </label>

          {selectedPlaylist ? (
            <div className="style-preview">
              <strong>{selectedPlaylist.name}</strong>
              <p>
                {selectedPlaylist.trackIds.length} {t.compose.forms.tracks} ·{" "}
                {t.compose.forms.medianBpm} {selectedPlaylistBpm?.toFixed(0) ?? "?"}
              </p>
              <p>{summarizePlaylistTracks(selectedPlaylist, tracks)}</p>
            </div>
          ) : null}
        </>
      )}

      <label className="field">
        <span>{t.compose.forms.structureLabel}</span>
        <select
          value={structureId}
          onChange={(event) => setStructureId(event.target.value)}
          disabled={busy || repositories.length === 0}
        >
          <option value="">{t.compose.forms.structureNone}</option>
          {repositories.map((repository) => (
            <option key={repository.id} value={repository.id}>
              {repository.title} · {repository.suggestedBpm?.toFixed(0) ?? t.library.noBpm} BPM
            </option>
          ))}
        </select>
      </label>

      {selectedStructure ? (
        <div className="style-preview">
          <strong>{selectedStructure.title}</strong>
          <p>
            {t.compose.forms.structurePreview.replace(
              "{bpm}",
              selectedStructure.suggestedBpm?.toFixed(0) ?? "?",
            )}
          </p>
        </div>
      ) : null}

      <label className="field">
        <span>{t.compose.forms.compositionLabel}</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={t.compose.forms.compositionLabelPlaceholder}
        />
      </label>

      <p className="field-hint">{t.compose.forms.hint}</p>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        <button
          type="submit"
          className="action"
          disabled={resolveImportCompositionSubmitDisabled({
            busy,
            baseAssets,
            baseMode,
            trackId,
            playlistId,
          })}
        >
          {busy ? (
            <>
              <span className="spin-ring" aria-hidden="true" /> {t.compose.forms.composing}
            </>
          ) : (
            t.compose.forms.createComposition
          )}
        </button>
      </div>
    </form>
  );
}
