import { useT } from "../../../i18n/I18nContext";
import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";

interface LiveSonificationSceneSelectorsProps {
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  onSceneBaseAssetIdChange: (baseAssetId: string) => void;
  onSceneCompositionIdChange: (compositionId: string) => void;
}

export function LiveSonificationSceneSelectors({
  availableBaseAssets,
  availableCompositions,
  sceneBaseAssetId,
  sceneCompositionId,
  onSceneBaseAssetIdChange,
  onSceneCompositionIdChange,
}: LiveSonificationSceneSelectorsProps) {
  const t = useT();

  return (
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
  );
}
