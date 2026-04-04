import type { BaseAssetRecord } from "../../../types/library";
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
  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Source</th>
            <th>Category</th>
            <th>Entries</th>
            <th>Reusable</th>
            <th>Status</th>
            <th>Imported</th>
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
                    {baseAsset.sourceKind === "directory" ? "Folder pack" : "Single file"}
                  </small>
                </td>
                <td title={baseAsset.sourcePath}>{baseAsset.sourcePath}</td>
                <td>{baseAsset.categoryLabel}</td>
                <td>{baseAsset.entryCount}</td>
                <td>{baseAsset.reusable ? "Yes" : "No"}</td>
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
                    Open
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
