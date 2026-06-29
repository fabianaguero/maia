import type { LibraryTrack, UpdateTrackPerformanceInput } from "../../../types/library";
import type { TrackColorOption } from "./trackPerformancePanelRuntime";

interface TrackPerformanceControlStripProps {
  performance: LibraryTrack["performance"];
  canEditPerformance: boolean;
  colorOptions: TrackColorOption[];
  ratingLabel: string;
  performanceLabel: string;
  colorLabel: string;
  unlockBpmLabel: string;
  lockBpmLabel: string;
  unlockGridLabel: string;
  lockGridLabel: string;
  markPlayedLabel: string;
  onUpdatePerformance: (update: UpdateTrackPerformanceInput) => void | Promise<void>;
}

export function TrackPerformanceControlStrip({
  performance,
  canEditPerformance,
  colorOptions,
  ratingLabel,
  performanceLabel,
  colorLabel,
  unlockBpmLabel,
  lockBpmLabel,
  unlockGridLabel,
  lockGridLabel,
  markPlayedLabel,
  onUpdatePerformance,
}: TrackPerformanceControlStripProps) {
  return (
    <div className="pill-strip top-spaced">
      <span>
        <label>
          {ratingLabel}
          <select
            className="compact-select"
            aria-label={performanceLabel}
            value={performance.rating}
            disabled={!canEditPerformance}
            onChange={(event) =>
              void onUpdatePerformance({
                rating: Number(event.target.value),
              })
            }
          >
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </span>
      <span>
        <label>
          {colorLabel}
          <select
            className="compact-select"
            aria-label={colorLabel}
            value={performance.color ?? ""}
            disabled={!canEditPerformance}
            onChange={(event) =>
              void onUpdatePerformance({
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
          disabled={!canEditPerformance}
          onClick={() =>
            void onUpdatePerformance({
              bpmLock: !performance.bpmLock,
            })
          }
        >
          {performance.bpmLock ? unlockBpmLabel : lockBpmLabel}
        </button>
      </span>
      <span>
        <button
          type="button"
          className="compact-action"
          disabled={!canEditPerformance}
          onClick={() =>
            void onUpdatePerformance({
              gridLock: !performance.gridLock,
            })
          }
        >
          {performance.gridLock ? unlockGridLabel : lockGridLabel}
        </button>
      </span>
      <span>
        <button
          type="button"
          className="secondary-action"
          disabled={!canEditPerformance}
          onClick={() =>
            void onUpdatePerformance({
              markPlayed: true,
            })
          }
        >
          {markPlayedLabel}
        </button>
      </span>
    </div>
  );
}
