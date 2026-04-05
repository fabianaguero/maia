import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type {
  BaseAssetRecord,
  CompositionReferenceType,
  ImportCompositionInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";

interface ImportCompositionFormProps {
  busy: boolean;
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
}

const referenceModes: Array<{
  id: CompositionReferenceType;
  label: string;
  help: string;
}> = [
  {
    id: "track",
    label: "Track BPM",
    help: "Use an imported track as the timing reference.",
  },
  {
    id: "repo",
    label: "Code/log BPM",
    help: "Use an imported repository or log heuristic as structural pacing.",
  },
  {
    id: "manual",
    label: "Manual BPM",
    help: "Type a target tempo directly for a quick sketch.",
  },
];

function deriveDefaultBaseAssetId(baseAssets: BaseAssetRecord[]): string {
  return baseAssets.find((entry) => entry.reusable)?.id ?? baseAssets[0]?.id ?? "";
}

export function ImportCompositionForm({
  busy,
  baseAssets,
  tracks,
  repositories,
  onImportComposition,
}: ImportCompositionFormProps) {
  const [baseAssetId, setBaseAssetId] = useState(deriveDefaultBaseAssetId(baseAssets));
  const [referenceType, setReferenceType] = useState<CompositionReferenceType>("track");
  const [referenceAssetId, setReferenceAssetId] = useState<string>(
    tracks[0]?.id ?? "",
  );
  const [manualBpm, setManualBpm] = useState("124");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseAssets.some((entry) => entry.id === baseAssetId)) {
      setBaseAssetId(deriveDefaultBaseAssetId(baseAssets));
    }
  }, [baseAssets, baseAssetId]);

  useEffect(() => {
    if (referenceType === "track") {
      if (!tracks.some((entry) => entry.id === referenceAssetId)) {
        setReferenceAssetId(tracks[0]?.id ?? "");
      }
      return;
    }

    if (referenceType === "repo") {
      if (!repositories.some((entry) => entry.id === referenceAssetId)) {
        setReferenceAssetId(repositories[0]?.id ?? "");
      }
      return;
    }

    setReferenceAssetId("");
  }, [referenceAssetId, referenceType, repositories, tracks]);

  const selectedBaseAsset =
    baseAssets.find((entry) => entry.id === baseAssetId) ?? null;
  const selectedTrack = tracks.find((entry) => entry.id === referenceAssetId) ?? null;
  const selectedRepository =
    repositories.find((entry) => entry.id === referenceAssetId) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!baseAssetId.trim()) {
      setError("Select a base asset before composing.");
      return;
    }

    if (referenceType !== "manual" && !referenceAssetId.trim()) {
      setError("Select a reference asset before composing.");
      return;
    }

    if (
      referenceType === "manual" &&
      (!manualBpm.trim() || Number.isNaN(Number(manualBpm)) || Number(manualBpm) <= 0)
    ) {
      setError("Manual BPM must be a positive number.");
      return;
    }

    setError(null);
    const imported = await onImportComposition({
      baseAssetId,
      referenceType,
      referenceAssetId: referenceType === "manual" ? undefined : referenceAssetId,
      manualBpm: referenceType === "manual" ? Number(manualBpm) : undefined,
      label: label.trim() || undefined,
    });

    if (imported) {
      setLabel("");
    }
  }

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>Create composition result</h2>
          <p className="support-copy">
            Derive a local composition plan from one reusable base asset plus a
            track, repository, or manual BPM reference.
          </p>
        </div>
      </div>

      <label className="field">
        <span>Base asset</span>
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
            {selectedBaseAsset.reusable ? "Reusable" : "Reference only"}
          </p>
        </div>
      ) : null}

      <div className="mode-toggle" role="tablist" aria-label="Composition reference type">
        {referenceModes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`toggle-chip${mode.id === referenceType ? " active" : ""}`}
            onClick={() => setReferenceType(mode.id)}
          >
            <span>{mode.label}</span>
            <small>{mode.help}</small>
          </button>
        ))}
      </div>

      {referenceType === "track" ? (
        <label className="field">
          <span>Track reference</span>
          <select
            value={referenceAssetId}
            onChange={(event) => setReferenceAssetId(event.target.value)}
            disabled={busy || tracks.length === 0}
          >
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title} · {track.bpm?.toFixed(0) ?? "No BPM"} BPM
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {referenceType === "repo" ? (
        <label className="field">
          <span>Code/log reference</span>
          <select
            value={referenceAssetId}
            onChange={(event) => setReferenceAssetId(event.target.value)}
            disabled={busy || repositories.length === 0}
          >
            {repositories.map((repository) => (
              <option key={repository.id} value={repository.id}>
                {repository.title} · {repository.suggestedBpm?.toFixed(0) ?? "No BPM"} BPM
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {referenceType === "manual" ? (
        <label className="field">
          <span>Manual BPM</span>
          <input
            value={manualBpm}
            onChange={(event) => setManualBpm(event.target.value)}
            inputMode="decimal"
            placeholder="124"
          />
        </label>
      ) : null}

      {selectedTrack ? (
        <p className="field-hint">
          Track reference: {selectedTrack.title} at {selectedTrack.bpm?.toFixed(0) ?? "?"} BPM.
        </p>
      ) : null}

      {selectedRepository ? (
        <p className="field-hint">
          Code/log reference: {selectedRepository.title} at{" "}
          {selectedRepository.suggestedBpm?.toFixed(0) ?? "?"} BPM.
        </p>
      ) : null}

      <label className="field">
        <span>Composition label</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Peak-hour club sketch"
        />
      </label>

      <p className="field-hint">
        Composition results are arrangement plans with preview artifacts, phrase sections, cue
        points, and a managed internal `preview.wav`, not rendered final audio files.
      </p>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        <button type="submit" className="action" disabled={busy || baseAssets.length === 0}>
          {busy ? "Composing..." : "Create composition"}
        </button>
      </div>
    </form>
  );
}
