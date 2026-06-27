import type { TrackSavedLoop } from "../../../types/library";

interface TrackColorOption {
  value: string;
  label: string;
}

interface TrackSavedLoopListProps {
  loops: TrackSavedLoop[];
  canEditPerformance: boolean;
  sectionLabel: string;
  emptyLabel: string;
  labelText: string;
  colorText: string;
  slotTemplate: string;
  loopWord: string;
  lockedLabel: string;
  editableLabel: string;
  setStartText: string;
  setEndText: string;
  unlockLoopText: string;
  lockLoopText: string;
  removeText: (name: string) => string;
  onSetBoundary: (loopId: string, boundary: "start" | "end") => void;
  onPatchLoop: (
    loopId: string,
    patch: Partial<Pick<TrackSavedLoop, "label" | "color" | "locked">>,
  ) => void;
  onRemoveLoop: (loopId: string) => void;
  renderLoopLabel: (
    loop: TrackSavedLoop,
    slotTemplate: string,
    loopWord: string,
    lockedLabel: string,
    editableLabel: string,
  ) => string;
  colorOptions: TrackColorOption[];
}

export function TrackSavedLoopList({
  loops,
  canEditPerformance,
  sectionLabel,
  emptyLabel,
  labelText,
  colorText,
  slotTemplate,
  loopWord,
  lockedLabel,
  editableLabel,
  setStartText,
  setEndText,
  unlockLoopText,
  lockLoopText,
  removeText,
  onSetBoundary,
  onPatchLoop,
  onRemoveLoop,
  renderLoopLabel,
  colorOptions,
}: TrackSavedLoopListProps) {
  return (
    <>
      <p className="support-copy top-spaced">{sectionLabel}</p>
      {loops.length > 0 ? (
        <ul className="stack-list">
          {loops.map((loop) => (
            <li key={loop.id}>
              <div className="pill-strip">
                <span>
                  {renderLoopLabel(loop, slotTemplate, loopWord, lockedLabel, editableLabel)}
                </span>
                <span>
                  <button
                    type="button"
                    className="compact-action"
                    aria-label={`${setStartText} ${loop.id}`}
                    disabled={!canEditPerformance}
                    onClick={() => onSetBoundary(loop.id, "start")}
                  >
                    {setStartText}
                  </button>
                </span>
                <span>
                  <button
                    type="button"
                    className="compact-action"
                    aria-label={`${setEndText} ${loop.id}`}
                    disabled={!canEditPerformance}
                    onClick={() => onSetBoundary(loop.id, "end")}
                  >
                    {setEndText}
                  </button>
                </span>
                <span>
                  <label>
                    {labelText}
                    <input
                      key={`${loop.id}:${loop.label}`}
                      className="compact-input"
                      aria-label={`${labelText} ${loop.id}`}
                      defaultValue={loop.label}
                      disabled={!canEditPerformance}
                      onBlur={(event) =>
                        onPatchLoop(loop.id, {
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
                      aria-label={`${colorText} ${loop.id}`}
                      value={loop.color ?? ""}
                      disabled={!canEditPerformance}
                      onChange={(event) =>
                        onPatchLoop(loop.id, {
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
                    className="compact-action"
                    aria-label={`${loop.locked ? unlockLoopText : lockLoopText} ${loop.id}`}
                    disabled={!canEditPerformance}
                    onClick={() =>
                      onPatchLoop(loop.id, {
                        locked: !loop.locked,
                      })
                    }
                  >
                    {loop.locked ? unlockLoopText : lockLoopText}
                  </button>
                </span>
                <span>
                  <button
                    type="button"
                    className="compact-action danger"
                    disabled={!canEditPerformance}
                    onClick={() => onRemoveLoop(loop.id)}
                  >
                    {removeText(loop.label)}
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
