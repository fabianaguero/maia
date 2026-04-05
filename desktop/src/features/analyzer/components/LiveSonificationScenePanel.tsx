import type {
  BaseAssetRecord,
  CompositionResultRecord,
} from "../../../types/library";
import type { ResolvedLiveSonificationScene } from "./liveSonificationScene";

interface LiveSonificationScenePanelProps {
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  onSceneBaseAssetIdChange: (baseAssetId: string) => void;
  onSceneCompositionIdChange: (compositionId: string) => void;
  scene: ResolvedLiveSonificationScene;
}

export function LiveSonificationScenePanel({
  availableBaseAssets,
  availableCompositions,
  sceneBaseAssetId,
  sceneCompositionId,
  onSceneBaseAssetIdChange,
  onSceneCompositionIdChange,
  scene,
}: LiveSonificationScenePanelProps) {
  return (
    <div className="render-audio-player top-spaced">
      <div className="panel-header">
        <div>
          <h2>Sonification scene</h2>
          <p className="support-copy">
            Choose the reusable base vocabulary and optional composition overlay that color the
            live log monitor. Maia keeps the runtime scene transient, without adding another core
            persisted entity, and triggers a real managed sample when the selected base asset
            exposes one.
          </p>
        </div>
      </div>

      <div className="live-scene-selectors">
        <label className="field">
          <span>Base asset vocabulary</span>
          <select
            value={sceneBaseAssetId}
            onChange={(event) => onSceneBaseAssetIdChange(event.target.value)}
            disabled={availableBaseAssets.length === 0}
          >
            <option value="">
              {availableBaseAssets.length === 0
                ? "No base assets available"
                : "Generic collection routing"}
            </option>
            {availableBaseAssets.map((baseAsset) => (
              <option key={baseAsset.id} value={baseAsset.id}>
                {baseAsset.title} · {baseAsset.categoryLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Composition overlay</span>
          <select
            value={sceneCompositionId}
            onChange={(event) => onSceneCompositionIdChange(event.target.value)}
          >
            <option value="">No composition overlay</option>
            {availableCompositions.map((composition) => (
              <option key={composition.id} value={composition.id}>
                {composition.title} · {composition.strategy}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="metric-grid top-spaced">
        <div>
          <span>Genre</span>
          <strong>{scene.genreLabel}</strong>
        </div>
        <div>
          <span>Preset</span>
          <strong>{scene.presetLabel}</strong>
        </div>
        <div>
          <span>Category</span>
          <strong>{scene.categoryLabel}</strong>
        </div>
        <div>
          <span>Strategy</span>
          <strong>{scene.strategy}</strong>
        </div>
        <div>
          <span>Reference</span>
          <strong>{scene.referenceTitle}</strong>
        </div>
        <div>
          <span>Headroom</span>
          <strong>{scene.headroomDb !== null ? `${scene.headroomDb.toFixed(1)} dB` : "Runtime only"}</strong>
        </div>
        <div>
          <span>Base asset</span>
          <strong>{scene.baseAsset?.title ?? "Generic routing"}</strong>
        </div>
        <div>
          <span>Composition</span>
          <strong>{scene.composition?.title ?? "None"}</strong>
        </div>
        <div>
          <span>Cue engine</span>
          <strong>
            {scene.sampleSourceMode === "multi-sample"
              ? "Multi-sample"
              : scene.sampleSourceMode === "single-sample"
                ? "Single sample"
                : "Internal synth"}
          </strong>
        </div>
        <div>
          <span>Sample count</span>
          <strong>{scene.sampleSourceCount}</strong>
        </div>
        {scene.referenceAnchor ? (
          <>
            <div>
              <span>Anchor track</span>
              <strong>{scene.referenceAnchor.trackTitle}</strong>
            </div>
            <div>
              <span>Anchor BPM</span>
              <strong>
                {scene.referenceAnchor.bpm !== null
                  ? `${scene.referenceAnchor.bpm.toFixed(0)} BPM`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Anchor energy</span>
              <strong>{(scene.referenceAnchor.energyLevel * 100).toFixed(0)} %</strong>
            </div>
            {scene.referenceAnchor.trackId === "playlist-blend" ? (
              <div>
                <span>Blend style</span>
                <strong>{scene.referenceAnchor.musicStyleId ?? "—"}</strong>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="audio-path-card top-spaced">
        <span>Preset</span>
        <strong>{scene.preset.descriptor}</strong>
      </div>

      <div className="render-master-card top-spaced">
        <span>Scene summary</span>
        <strong>{scene.summary}</strong>
      </div>

      <div className="audio-path-card top-spaced">
        <span>Sample routing</span>
        <strong>{scene.sampleSourceDetail}</strong>
      </div>

      {scene.masterChain.length > 0 ? (
        <div className="pill-strip top-spaced">
          {scene.masterChain.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      ) : null}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Live routing</h2>
          <p className="support-copy">
            Severity and anomaly levels map to deterministic stems, sections, and cue labels from
            the active scene.
          </p>
        </div>
      </div>

      <div className="live-scene-route-grid">
        {scene.routes.map((route) => (
          <article key={route.key} className={`live-scene-route-card route-${route.key}`}>
            <span>
              {route.key} · {route.waveform}
            </span>
            <strong>{route.label}</strong>
            <small>
              {route.stemLabel} · {route.sectionLabel}
            </small>
            <p>{route.focus}</p>
            <div className="pill-strip">
              <span>{route.cueLabel}</span>
              <span>{route.sampleLabel ?? "Synth fallback"}</span>
              <span>{route.pan > 0 ? `Pan R ${route.pan.toFixed(2)}` : route.pan < 0 ? `Pan L ${Math.abs(route.pan).toFixed(2)}` : "Pan C"}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
