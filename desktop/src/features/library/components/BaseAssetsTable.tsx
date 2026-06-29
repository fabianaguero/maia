import type { BaseAssetRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import { formatShortDateTime } from "../../../utils/date";

interface BaseAssetsTableProps {
  baseAssets: BaseAssetRecord[];
  selectedBaseAssetId: string | null;
  onSelectBaseAsset: (baseAssetId: string) => void;
  onInspectBaseAsset: (baseAssetId: string) => void;
}

export function BaseAssetsTable({
  baseAssets,
  selectedBaseAssetId,
  onSelectBaseAsset,
  onInspectBaseAsset,
}: BaseAssetsTableProps) {
  const t = useT();
  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>{t.library.tables.baseAssets.asset}</th>
            <th>{t.library.tables.baseAssets.source}</th>
            <th>{t.library.tables.baseAssets.category}</th>
            <th>{t.library.tables.baseAssets.entries}</th>
            <th>{t.library.tables.baseAssets.reusable}</th>
            <th>{t.library.tables.baseAssets.status}</th>
            <th>{t.library.tables.baseAssets.imported}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {baseAssets.map((baseAsset) => {
            const selected = baseAsset.id === selectedBaseAssetId;

            return (
              <tr
                key={baseAsset.id}
                className={selected ? "selected" : undefined}
                onClick={() => onSelectBaseAsset(baseAsset.id)}
              >
                <td>
                  <strong>{baseAsset.title}</strong>
                  <small>
                    {baseAsset.sourceKind === "directory"
                      ? t.library.forms.baseAsset.folderPack
                      : t.library.forms.baseAsset.singleFile}
                  </small>
                </td>
                <td title={baseAsset.sourcePath}>{baseAsset.sourcePath}</td>
                <td>{baseAsset.categoryLabel}</td>
                <td>{baseAsset.entryCount}</td>
                <td>{baseAsset.reusable ? t.inspect.yes : t.library.tables.baseAssets.no}</td>
                <td>{baseAsset.analyzerStatus}</td>
                <td>{formatShortDateTime(baseAsset.importedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="table-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      onInspectBaseAsset(baseAsset.id);
                    }}
                  >
                    {t.library.tables.baseAssets.open}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
