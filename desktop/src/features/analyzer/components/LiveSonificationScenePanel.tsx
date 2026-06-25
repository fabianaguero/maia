import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
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
  const t = useT();

  return (
    <div className="render-audio-player top-spaced">
      <div className="panel-header">
        <div>
          <h2>{t.inspect.liveSceneTitle}</h2>
          <p className="support-copy">{t.inspect.liveSceneCopy}</p>
        </div>
      </div>

      <div className="live-scene-selectors">
        <label className="field">
          <span>{t.inspect.baseAssetVocabulary}</span>
          <select
            value={sceneBaseAssetId}
            onChange={(event) => onSceneBaseAssetIdChange(event.target.value)}
            disabled={availableBaseAssets.length === 0}
          >
            <option value="">
              {availableBaseAssets.length === 0
                ? t.inspect.noBaseAssetsAvailable
                : t.inspect.genericCollectionRouting}
            </option>
            {availableBaseAssets.map((baseAsset) => (
              <option key={baseAsset.id} value={baseAsset.id}>
                {baseAsset.title} · {baseAsset.categoryLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>{t.inspect.compositionOverlay}</span>
          <select
            value={sceneCompositionId}
            onChange={(event) => onSceneCompositionIdChange(event.target.value)}
          >
            <option value="">{t.inspect.noCompositionOverlay}</option>
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
          <span>{t.inspect.styleProfile}</span>
          <strong>{scene.styleProfile.label}</strong>
        </div>
        <div>
          <span>{t.inspect.mutationProfile}</span>
          <strong>{scene.mutationProfile.label}</strong>
        </div>
        <div>
          <span>{t.inspect.playlistBlend}</span>
          <strong>
            {scene.styleProfile.transitionFeel} ·{" "}
            {scene.styleProfile.playlistCrossfadeSeconds.toFixed(1)}s
          </strong>
        </div>
        <div>
          <span>{t.inspect.genre}</span>
          <strong>{scene.genreLabel}</strong>
        </div>
        <div>
          <span>{t.inspect.preset}</span>
          <strong>{scene.presetLabel}</strong>
        </div>
        <div>
          <span>{t.inspect.category}</span>
          <strong>{scene.categoryLabel}</strong>
        </div>
        <div>
          <span>{t.inspect.sceneStrategy}</span>
          <strong>{scene.strategy}</strong>
        </div>
        <div>
          <span>{t.inspect.sceneSource}</span>
          <strong>{scene.referenceTitle}</strong>
        </div>
        <div>
          <span>{t.inspect.sceneHeadroom}</span>
          <strong>
            {scene.headroomDb !== null
              ? `${scene.headroomDb.toFixed(1)} dB`
              : t.inspect.runtimeOnly}
          </strong>
        </div>
        <div>
          <span>{t.inspect.baseAssetLabel}</span>
          <strong>{scene.baseAsset?.title ?? t.inspect.genericRouting}</strong>
        </div>
        <div>
          <span>{t.inspect.compositionLabel}</span>
          <strong>{scene.composition?.title ?? t.inspect.none}</strong>
        </div>
        <div>
          <span>{t.inspect.cueEngine}</span>
          <strong>
            {scene.sampleSourceMode === "multi-sample"
              ? t.inspect.multiSample
              : scene.sampleSourceMode === "single-sample"
                ? t.inspect.singleSample
                : t.inspect.internalSynth}
          </strong>
        </div>
        <div>
          <span>{t.inspect.sampleCount}</span>
          <strong>{scene.sampleSourceCount}</strong>
        </div>
        {scene.referenceAnchor ? (
          <>
            <div>
              <span>{t.inspect.baseTrack}</span>
              <strong>{scene.referenceAnchor.trackTitle}</strong>
            </div>
            <div>
              <span>{t.inspect.baseBpm}</span>
              <strong>
                {scene.referenceAnchor.bpm !== null
                  ? `${scene.referenceAnchor.bpm.toFixed(0)} BPM`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>{t.inspect.baseEnergy}</span>
              <strong>{(scene.referenceAnchor.energyLevel * 100).toFixed(0)} %</strong>
            </div>
            {scene.referenceAnchor.trackId === "playlist-blend" ? (
              <div>
                <span>{t.inspect.baseBlendStyle}</span>
                <strong>{scene.referenceAnchor.musicStyleId ?? "—"}</strong>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="audio-path-card top-spaced">
        <span>{t.inspect.runtimePattern}</span>
        <strong>{scene.preset.descriptor}</strong>
        <small>{scene.styleProfile.description}</small>
      </div>

      <div className="render-master-card top-spaced">
        <span>{t.inspect.sceneSummary}</span>
        <strong>{scene.summary}</strong>
      </div>

      <div className="audio-path-card top-spaced">
        <span>{t.inspect.mutationBehavior}</span>
        <strong>{scene.mutationProfile.description}</strong>
      </div>

      <div className="audio-path-card top-spaced">
        <span>{t.inspect.sampleRouting}</span>
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
          <h2>{t.inspect.liveRouting}</h2>
          <p className="support-copy">{t.inspect.liveRoutingCopy}</p>
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
              <span>{route.sampleLabel ?? t.inspect.synthFallback}</span>
              <span>
                {route.pan > 0
                  ? t.inspect.panRight.replace("{value}", route.pan.toFixed(2))
                  : route.pan < 0
                    ? t.inspect.panLeft.replace("{value}", Math.abs(route.pan).toFixed(2))
                    : t.inspect.panCenter}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
