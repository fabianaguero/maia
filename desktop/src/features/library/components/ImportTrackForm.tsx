import { FolderOpen, Music, Shuffle } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { pickTrackSourcePath } from "../../../api/library";
import type { ImportTrackInput } from "../../../types/library";
import type { MusicStyleOption } from "../../../types/music";

interface ImportTrackFormProps {
  busy: boolean;
  musicStyles: MusicStyleOption[];
  defaultMusicStyleId?: string;
  onImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
}

function deriveTitle(sourcePath: string): string {
  const tail = sourcePath.trim().split(/[\\/]/).pop() ?? "";
  return tail.replace(/\.[^.]+$/, "") || "Imported Track";
}

export function ImportTrackForm({
  busy,
  musicStyles,
  defaultMusicStyleId,
  onImportTrack,
  onSeedDemo,
}: ImportTrackFormProps) {
  const fallbackMusicStyleId =
    defaultMusicStyleId ?? musicStyles[0]?.id ?? "";
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
    const normalizedTitle = title.trim() || deriveTitle(normalizedPath);
    const normalizedMusicStyleId = musicStyleId.trim();

    if (!normalizedPath) {
      setError("A local source path is required.");
      return;
    }

    if (!normalizedMusicStyleId) {
      setError("Select a music style before importing the track.");
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

  const selectedMusicStyle =
    musicStyles.find((style) => style.id === musicStyleId) ?? null;

  async function handleBrowseTrack(): Promise<void> {
    setPickerBusy(true);
    setError(null);

    try {
      const pickedPath = await pickTrackSourcePath(sourcePath);
      if (!pickedPath) {
        return;
      }

      setSourcePath(pickedPath);
      setTitle((current) => current.trim() || deriveTitle(pickedPath));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Native file picker failed. Enter the path manually.",
      );
    } finally {
      setPickerBusy(false);
    }
  }

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>Import track</h2>
          <p className="support-copy">
            Select a configured music style before importing. The chosen prior
            is persisted locally. Browsing can use the native desktop picker,
            but waveform and BPM processing run inside the analyzer during import.
          </p>
        </div>
      </div>

      <label className="field">
        <span>Music style</span>
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
        <span>Track title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Night Drive"
        />
      </label>

      <label className="field">
        <span>Local path</span>
        <input
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder="~/Music/night-drive.wav"
        />
      </label>

      <p className="field-hint">
        Browse uses the native desktop picker when available. Embedded analysis
        currently decodes WAV, MP3, FLAC, and OGG/Vorbis inside the analyzer;
        other formats still import with a deterministic fallback.
      </p>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-action"
          onClick={() => void handleBrowseTrack()}
          disabled={busy || pickerBusy}
        >
          {pickerBusy ? <><span className="spin-ring" aria-hidden="true" /> Browsing...</> : <><FolderOpen size={14} /> Browse audio file</>}
        </button>
        <button type="submit" className="action" disabled={busy}>
          {busy ? <><span className="spin-ring" aria-hidden="true" /> Saving...</> : <><Music size={14} /> Import track</>}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => void onSeedDemo()}
          disabled={busy}
        >
          <Shuffle size={14} /> Load demo tracks
        </button>
      </div>
    </form>
  );
}
