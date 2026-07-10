import { FolderOpen, Music, Shuffle } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { pickTrackSourcePath } from "../../../api/library";
import { RuntimeStatusCard } from "../../../components/RuntimeStatusCard";
import { useT } from "../../../i18n/I18nContext";
import type { ImportTrackInput } from "../../../types/library";
import type { MusicStyleOption } from "../../../types/music";

interface ImportTrackFormProps {
  busy: boolean;
  musicStyles: MusicStyleOption[];
  defaultMusicStyleId?: string;
  onImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
}

function deriveTitle(sourcePath: string, fallbackTitle: string): string {
  const tail = sourcePath.trim().split(/[\\/]/).pop() ?? "";
  return tail.replace(/\.[^.]+$/, "") || fallbackTitle;
}

export function ImportTrackForm({
  busy,
  musicStyles,
  defaultMusicStyleId,
  onImportTrack,
  onSeedDemo,
}: ImportTrackFormProps) {
  const t = useT();
  const fallbackMusicStyleId = defaultMusicStyleId ?? musicStyles[0]?.id ?? "";
  const [title, setTitle] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [musicStyleId, setMusicStyleId] = useState(fallbackMusicStyleId);
  const [error, setError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  useEffect(() => {
    if (!musicStyles.some((style) => style.id === musicStyleId)) {
      setMusicStyleId(fallbackMusicStyleId);
    }
  }, [fallbackMusicStyleId, musicStyleId, musicStyles]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPath = sourcePath.trim();
    const normalizedTitle =
      title.trim() || deriveTitle(normalizedPath, t.library.forms.track.fallbackTitle);
    const normalizedMusicStyleId = musicStyleId.trim();

    if (!normalizedPath) {
      setError(t.library.forms.track.pathRequiredError);
      return;
    }

    if (!normalizedMusicStyleId) {
      setError(t.library.forms.track.musicStyleRequiredError);
      return;
    }

    setError(null);
    const imported = await onImportTrack({
      title: normalizedTitle,
      sourcePath: normalizedPath,
      musicStyleId: normalizedMusicStyleId,
    });

    if (imported) {
      setTitle("");
      setSourcePath("");
      setMusicStyleId(fallbackMusicStyleId);
    }
  }

  const selectedMusicStyle = musicStyles.find((style) => style.id === musicStyleId) ?? null;

  async function handleBrowseTrack(): Promise<void> {
    setPickerBusy(true);
    setError(null);

    try {
      const pickedPath = await pickTrackSourcePath(sourcePath);
      if (!pickedPath) {
        return;
      }

      setSourcePath(pickedPath);
      setTitle(
        (current) => current.trim() || deriveTitle(pickedPath, t.library.forms.track.fallbackTitle),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t.library.forms.track.pickerFailed);
    } finally {
      setPickerBusy(false);
    }
  }

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>{t.library.forms.track.title}</h2>
          <p className="support-copy">{t.library.forms.track.description}</p>
        </div>
      </div>

      <label className="field">
        <span>{t.library.forms.track.musicStyle}</span>
        <select
          value={musicStyleId}
          onChange={(event) => setMusicStyleId(event.target.value)}
          disabled={busy || musicStyles.length === 0}
        >
          {musicStyles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>
      </label>

      {selectedMusicStyle ? (
        <div className="style-preview">
          <strong>{selectedMusicStyle.label}</strong>
          <span>
            {selectedMusicStyle.minBpm}-{selectedMusicStyle.maxBpm} BPM
          </span>
          <p>{selectedMusicStyle.description}</p>
        </div>
      ) : null}

      <label className="field">
        <span>{t.library.forms.track.trackTitle}</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t.library.forms.track.trackTitlePlaceholder}
        />
      </label>

      <label className="field">
        <span>{t.library.forms.track.localPath}</span>
        <input
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder={t.library.forms.track.localPathPlaceholder}
        />
      </label>

      <p className="field-hint">{t.library.forms.track.hint}</p>

      {error ? <p className="inline-error">{error}</p> : null}
      {busy || pickerBusy ? (
        <RuntimeStatusCard
          title={pickerBusy ? t.library.forms.track.browsing : t.library.forms.track.saving}
          detail={pickerBusy ? t.library.forms.track.localPathPlaceholder : title || sourcePath}
          badge={
            pickerBusy ? t.library.forms.track.browseAudioFile : t.library.forms.track.importTrack
          }
          tone="pending"
          activity="spinner"
          compact
          className="form-runtime-status"
        />
      ) : null}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-action"
          onClick={() => void handleBrowseTrack()}
          disabled={busy || pickerBusy}
        >
          {pickerBusy ? (
            t.library.forms.track.browsing
          ) : (
            <>
              <FolderOpen size={14} /> {t.library.forms.track.browseAudioFile}
            </>
          )}
        </button>
        <button type="submit" className="action" disabled={busy}>
          {busy ? (
            t.library.forms.track.saving
          ) : (
            <>
              <Music size={14} /> {t.library.forms.track.importTrack}
            </>
          )}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => void onSeedDemo()}
          disabled={busy}
        >
          <Shuffle size={14} /> {t.library.forms.track.loadDemoTracks}
        </button>
      </div>
    </form>
  );
}
