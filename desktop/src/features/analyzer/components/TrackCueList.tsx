import type { TrackCuePoint } from "../../../types/library";

interface TrackColorOption {
  value: string;
  label: string;
}

interface TrackCueListProps {
  cues: TrackCuePoint[];
  cueKind: "hot" | "memory";
  canEditPerformance: boolean;
  sectionLabel: string;
  emptyLabel: string;
  labelText: string;
  colorText: string;
  removeText: (name: string) => string;
  slotTemplate: string;
  pendingLabel: string;
  onPatchCue: (
    kind: "hot" | "memory",
    cueId: string,
    patch: Partial<Pick<TrackCuePoint, "label" | "color">>,
  ) => void;
  onRemoveCue: (kind: "hot" | "memory", cueId: string) => void;
  renderCueLabel: (cue: TrackCuePoint, slotTemplate: string, pendingLabel?: string) => string;
  colorOptions: TrackColorOption[];
}

export function TrackCueList({
  cues,
  cueKind,
  canEditPerformance,
  sectionLabel,
  emptyLabel,
  labelText,
  colorText,
  removeText,
  slotTemplate,
  pendingLabel,
  onPatchCue,
  onRemoveCue,
  renderCueLabel,
  colorOptions,
}: TrackCueListProps) {
  return (
    <>
      <p className="support-copy top-spaced">{sectionLabel}</p>
      {cues.length > 0 ? (
        <ul className="stack-list">
          {cues.map((cue) => (
            <li key={cue.id}>
              <div className="pill-strip">
                <span>{renderCueLabel(cue, slotTemplate, pendingLabel)}</span>
                <span>
                  <label>
                    {labelText}
                    <input
                      key={`${cue.id}:${cue.label}`}
                      className="compact-input"
                      aria-label={`${labelText} ${cue.id}`}
                      defaultValue={cue.label}
                      disabled={!canEditPerformance}
                      onBlur={(event) =>
                        onPatchCue(cueKind, cue.id, {
                          label: event.target.value,
                        })
                      }
                    />
                  </label>
                </span>
                <span>
                  <label>
                    {colorText}
                    <select
                      className="compact-select"
                      aria-label={`${colorText} ${cue.id}`}
                      value={cue.color ?? ""}
                      disabled={!canEditPerformance}
                      onChange={(event) =>
                        onPatchCue(cueKind, cue.id, {
                          color: event.target.value || null,
                        })
                      }
                    >
                      {colorOptions.map((option) => (
                        <option key={option.value || "none"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </span>
                <span>
                  <button
                    type="button"
                    className="compact-action danger"
                    disabled={!canEditPerformance}
                    onClick={() => onRemoveCue(cueKind, cue.id)}
                  >
                    {removeText(cue.label)}
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="support-copy">{emptyLabel}</p>
      )}
    </>
  );
}
