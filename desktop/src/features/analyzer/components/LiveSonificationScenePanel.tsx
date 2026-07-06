import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import type { ResolvedLiveSonificationScene } from "./liveSonificationScene";
import { LiveSonificationSceneMetrics } from "./LiveSonificationSceneMetrics";
import { LiveSonificationSceneRoutes } from "./LiveSonificationSceneRoutes";
import { LiveSonificationSceneSelectors } from "./LiveSonificationSceneSelectors";

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

      <LiveSonificationSceneSelectors
        availableBaseAssets={availableBaseAssets}
        availableCompositions={availableCompositions}
        sceneBaseAssetId={sceneBaseAssetId}
        sceneCompositionId={sceneCompositionId}
        onSceneBaseAssetIdChange={onSceneBaseAssetIdChange}
        onSceneCompositionIdChange={onSceneCompositionIdChange}
      />
      <LiveSonificationSceneMetrics scene={scene} />
      <LiveSonificationSceneRoutes scene={scene} />
    </div>
  );
}
