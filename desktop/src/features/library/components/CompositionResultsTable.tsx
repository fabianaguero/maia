import type { CompositionResultRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import { formatShortDateTime } from "../../../utils/date";

function formatTimingSourceType(
  referenceType: CompositionResultRecord["referenceType"],
  t: ReturnType<typeof useT>,
): string {
  if (referenceType === "track") {
    return t.compose.table.baseTrack;
  }

  if (referenceType === "playlist") {
    return t.compose.table.basePlaylist;
  }

  if (referenceType === "repo") {
    return t.compose.table.structureSource;
  }

  return t.compose.table.manualBpm;
}

interface CompositionResultsTableProps {
  compositions: CompositionResultRecord[];
  selectedCompositionId: string | null;
  onSelectComposition: (compositionId: string) => void;
  onInspectComposition: (compositionId: string) => void;
}

export function CompositionResultsTable({
  compositions,
  selectedCompositionId,
  onSelectComposition,
  onInspectComposition,
}: CompositionResultsTableProps) {
  const t = useT();
  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>{t.compose.table.composition}</th>
            <th>{t.compose.table.baseAsset}</th>
            <th>{t.compose.table.timingSource}</th>
            <th>{t.compose.table.targetBpm}</th>
            <th>{t.compose.table.strategy}</th>
            <th>{t.compose.table.status}</th>
            <th>{t.compose.table.created}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {compositions.map((composition) => {
            const selected = composition.id === selectedCompositionId;

            return (
              <tr
                key={composition.id}
                className={selected ? "selected" : undefined}
                onClick={() => onSelectComposition(composition.id)}
              >
                <td>
                  <strong>{composition.title}</strong>
                  <small>{composition.summary}</small>
                </td>
                <td>
                  <strong>{composition.baseAssetTitle}</strong>
                  <small>{composition.baseAssetCategoryLabel}</small>
                </td>
                <td>
                  <strong>{composition.referenceTitle}</strong>
                  <small>{formatTimingSourceType(composition.referenceType, t)}</small>
                </td>
                <td>{composition.targetBpm.toFixed(0)}</td>
                <td>{composition.strategy}</td>
                <td>{composition.analyzerStatus}</td>
                <td>{formatShortDateTime(composition.importedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="table-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      onInspectComposition(composition.id);
                    }}
                  >
                    {t.compose.table.open}
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
