import type { FormEvent } from "react";
import { useState } from "react";

import type { ImportTrackInput } from "../../../types/library";

interface ImportTrackFormProps {
  busy: boolean;
  onImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
}

function deriveTitle(sourcePath: string): string {
  const tail = sourcePath.trim().split(/[\\/]/).pop() ?? "";
  return tail.replace(/\.[^.]+$/, "") || "Imported Track";
}

export function ImportTrackForm({
  busy,
  onImportTrack,
  onSeedDemo,
}: ImportTrackFormProps) {
  const [title, setTitle] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPath = sourcePath.trim();
    const normalizedTitle = title.trim() || deriveTitle(normalizedPath);

    if (!normalizedPath) {
      setError("A local source path is required.");
      return;
    }

    setError(null);
    const imported = await onImportTrack({
      title: normalizedTitle,
      sourcePath: normalizedPath,
    });

    if (imported) {
      setTitle("");
      setSourcePath("");
    }
  }

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>Import track</h2>
          <p className="support-copy">
            Persist a lightweight mocked analysis into the local library. File
            picker integration can land later.
          </p>
        </div>
      </div>

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

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        <button type="submit" className="action" disabled={busy}>
          {busy ? "Saving..." : "Import mock track"}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => void onSeedDemo()}
          disabled={busy}
        >
          Load demo tracks
        </button>
      </div>
    </form>
  );
}
