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
  const [trackId, setTrackId] = useState<string>(tracks[0]?.id ?? "");
  const [structureId, setStructureId] = useState<string>("");
  const [referenceType, setReferenceType] = useState<CompositionReferenceType>("track");
  const [manualBpm, setManualBpm] = useState("124");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseAssets.some((entry) => entry.id === baseAssetId)) {
      setBaseAssetId(deriveDefaultBaseAssetId(baseAssets));
    }
  }, [baseAssets, baseAssetId]);

  useEffect(() => {
    // Keep track ID in sync with available tracks
    if (!tracks.some((entry) => entry.id === trackId)) {
      setTrackId(tracks[0]?.id ?? "");
    }
  }, [trackId, tracks]);

  useEffect(() => {
    // Keep structure ID valid if set
    if (structureId && !repositories.some((entry) => entry.id === structureId)) {
      setStructureId("");
    }
  }, [structureId, repositories]);

  const selectedBaseAsset =
    baseAssets.find((entry) => entry.id === baseAssetId) ?? null;
  const selectedTrack = tracks.find((entry) => entry.id === trackId) ?? null;
  const selectedStructure = structureId
    ? repositories.find((entry) => entry.id === structureId) ?? null
    : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!baseAssetId.trim()) {
      setError("Select a base asset before composing.");
      return;
    }

    if (!trackId.trim()) {
      setError("Select a track as the instrumental base.");
      return;
    }

    setError(null);

    // Determine reference type based on selections
    let actualRefType: CompositionReferenceType = "track";
    let actualRefAssetId: string | undefined = trackId;

    // If user also selected a repo/log for structure, use that as reference for BPM
    if (structureId) {
      actualRefType = "repo";
      actualRefAssetId = structureId;
    }

    const imported = await onImportComposition({
      baseAssetId,
      trackId,
      structureId: structureId || undefined,
      referenceType: actualRefType,
      referenceAssetId: actualRefAssetId,
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
            Use a track as the instrumental base, optionally layered with code/log analysis for
            structural variation based on anomalies.
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

      <label className="field">
        <span>Track (instrumental base) *</span>
        <select
          value={trackId}
          onChange={(event) => setTrackId(event.target.value)}
          disabled={busy || tracks.length === 0}
        >
          <option value="">— Select a track —</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title} · {track.bpm?.toFixed(0) ?? "No BPM"} BPM
            </option>
          ))}
        </select>
      </label>

      {selectedTrack ? (
        <div className="style-preview">
          <strong>{selectedTrack.title}</strong>
          <p>
            Instrumental base at {selectedTrack.bpm?.toFixed(0) ?? "?"} BPM
          </p>
        </div>
      ) : null}

      <label className="field">
        <span>Code/Log (structural variation) - optional</span>
        <select
          value={structureId}
          onChange={(event) => setStructureId(event.target.value)}
          disabled={busy || repositories.length === 0}
        >
          <option value="">— None (use track BPM only) —</option>
          {repositories.map((repository) => (
            <option key={repository.id} value={repository.id}>
              {repository.title} · {repository.suggestedBpm?.toFixed(0) ?? "No BPM"} BPM
            </option>
          ))}
        </select>
      </label>

      {selectedStructure ? (
        <div className="style-preview">
          <strong>{selectedStructure.title}</strong>
          <p>
            Structural reference at {selectedStructure.suggestedBpm?.toFixed(0) ?? "?"} BPM
            (anomalies will drive variations)
          </p>
        </div>
      ) : null}

      <label className="field">
        <span>Composition label</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Peak-hour with error motifs"
        />
      </label>

      <p className="field-hint">
        Composition results are arrangement plans with preview artifacts, phrase sections, cue
        points, and a managed internal `preview.wav`. The track provides the beat, and anomalies
        from the code/log (errors, warnings) modulate the arrangement.
      </p>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        <button type="submit" className="action" disabled={busy || baseAssets.length === 0 || !trackId}>
          {busy ? <><span className="spin-ring" aria-hidden="true" /> Composing...</> : "Create composition"}
        </button>
      </div>
    </form>
  );
}
