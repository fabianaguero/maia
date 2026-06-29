interface InspectContextBarProps {
  mode: "track" | "repo" | "base";
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  selectedTrackId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  trackOptions: Array<{ id: string; label: string }>;
  repositoryOptions: Array<{ id: string; label: string }>;
  baseAssetOptions: Array<{ id: string; label: string }>;
  labels: {
    tracks: string;
    logSources: string;
    bases: string;
  };
  onChangeMode: (mode: "track" | "repo" | "base") => void;
  onSelectTrack: (id: string) => void;
  onSelectRepository: (id: string) => void;
  onSelectBaseAsset: (id: string) => void;
}

export function InspectContextBar({
  mode,
  trackCount,
  repositoryCount,
  baseAssetCount,
  selectedTrackId,
  selectedRepositoryId,
  selectedBaseAssetId,
  trackOptions,
  repositoryOptions,
  baseAssetOptions,
  labels,
  onChangeMode,
  onSelectTrack,
  onSelectRepository,
  onSelectBaseAsset,
}: InspectContextBarProps) {
  return (
    <div className="analyzer-context-bar">
      <div className="analyzer-mode-tabs">
        {trackCount > 0 ? (
          <button
            type="button"
            className={mode === "track" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("track")}
          >
            {labels.tracks}
            <span className="mode-tab-count">{trackCount}</span>
          </button>
        ) : null}
        {repositoryCount > 0 ? (
          <button
            type="button"
            className={mode === "repo" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("repo")}
          >
            {labels.logSources}
            <span className="mode-tab-count">{repositoryCount}</span>
          </button>
        ) : null}
        {baseAssetCount > 0 ? (
          <button
            type="button"
            className={mode === "base" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("base")}
          >
            {labels.bases}
            <span className="mode-tab-count">{baseAssetCount}</span>
          </button>
        ) : null}
      </div>

      <div className="analyzer-asset-picker">
        {mode === "track" && trackCount > 0 ? (
          <select
            value={selectedTrackId ?? ""}
            onChange={(event) => onSelectTrack(event.target.value)}
            className="context-select"
          >
            {trackOptions.map((track) => (
              <option key={track.id} value={track.id}>
                {track.label}
              </option>
            ))}
          </select>
        ) : null}
        {mode === "repo" && repositoryCount > 0 ? (
          <select
            value={selectedRepositoryId ?? ""}
            onChange={(event) => onSelectRepository(event.target.value)}
            className="context-select"
          >
            {repositoryOptions.map((repository) => (
              <option key={repository.id} value={repository.id}>
                {repository.label}
              </option>
            ))}
          </select>
        ) : null}
        {mode === "base" && baseAssetCount > 0 ? (
          <select
            value={selectedBaseAssetId ?? ""}
            onChange={(event) => onSelectBaseAsset(event.target.value)}
            className="context-select"
          >
            {baseAssetOptions.map((baseAsset) => (
              <option key={baseAsset.id} value={baseAsset.id}>
                {baseAsset.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}
