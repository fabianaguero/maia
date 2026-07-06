import { useT } from "../../../i18n/I18nContext";
import type { ResolvedLiveSonificationScene } from "./liveSonificationScene";

interface LiveSonificationSceneMetricsProps {
  scene: ResolvedLiveSonificationScene;
}

export function LiveSonificationSceneMetrics({ scene }: LiveSonificationSceneMetricsProps) {
  const t = useT();

  return (
    <>
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
    </>
  );
}
