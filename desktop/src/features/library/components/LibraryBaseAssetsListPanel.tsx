import { PackagePlus } from "lucide-react";

import { useT } from "../../../i18n/I18nContext";
import type { BaseAssetRecord } from "../../../types/library";
import { buildLibraryBaseAssetsViewModel } from "../libraryBaseAssetsViewModel";

interface LibraryBaseAssetsListPanelProps {
  assets: BaseAssetRecord[];
  newlyImportedId?: string | null;
  selectedBaseAssetId: string | null;
  onInspectBaseAsset: (baseAssetId: string) => void;
  onSelectBaseAsset: (baseAssetId: string) => void;
}

export function LibraryBaseAssetsListPanel({
  assets,
  newlyImportedId,
  selectedBaseAssetId,
  onInspectBaseAsset,
  onSelectBaseAsset,
}: LibraryBaseAssetsListPanelProps) {
  const t = useT();
  const viewModel = buildLibraryBaseAssetsViewModel({
    assets,
    newlyImportedId,
    selectedBaseAssetId,
    t,
  });

  return (
    <ul className="asset-card-list">
      {viewModel.map((asset) => (
        <li
          key={asset.id}
          className={`asset-card${asset.isSelected ? " selected" : ""}${asset.isNewlyImported ? " just-imported" : ""}`}
          onClick={() => onSelectBaseAsset(asset.id)}
        >
          <div className="asset-card-icon base-icon">
            <PackagePlus size={18} />
          </div>
          <div className="asset-card-body">
            <strong className="asset-card-title">{asset.title}</strong>
            <div className="asset-card-meta">
              <span className="type-badge">{asset.meta}</span>
              <span className={`status-badge ${asset.statusClassName}`}>{asset.statusLabel}</span>
            </div>
            <span className="asset-card-date">{asset.importedAtLabel}</span>
          </div>
          <div className="asset-card-actions">
            <button
              type="button"
              className="card-action-btn"
              onClick={(event) => {
                event.stopPropagation();
                onInspectBaseAsset(asset.id);
              }}
            >
              {t.library.analyze}
            </button>
            {asset.showComposeAction ? (
              <button
                type="button"
                className="card-action-compose"
                onClick={(event) => {
                  event.stopPropagation();
                  onInspectBaseAsset(asset.id);
                }}
              >
                {t.library.compose} →
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
