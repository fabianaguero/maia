import type { CompositionResultRecord } from "../../../types/library";
import { formatShortDateTime } from "../../../utils/date";

function formatTimingSourceType(referenceType: CompositionResultRecord["referenceType"]): string {
  if (referenceType === "track") {
    return "base track";
  }

  if (referenceType === "playlist") {
    return "base playlist";
  }

  if (referenceType === "repo") {
    return "structure source";
  }

  return "manual bpm";
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
  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>Composition</th>
            <th>Base asset</th>
            <th>Timing source</th>
            <th>Target BPM</th>
            <th>Strategy</th>
            <th>Status</th>
            <th>Created</th>
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
                  <small>{formatTimingSourceType(composition.referenceType)}</small>
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
