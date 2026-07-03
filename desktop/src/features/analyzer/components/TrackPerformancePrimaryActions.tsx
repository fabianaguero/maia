import type {
  TrackPerformanceCueLoopActionViewModel,
  TrackPerformanceCueLoopPresetViewModel,
} from "./trackPerformanceCueLoopSectionRuntime";

interface TrackPerformancePrimaryActionsProps {
  playheadHint: string;
  quantizeEnabled: boolean;
  quantizeAvailable: boolean;
  quantizeToggleLabel: string;
  actions: TrackPerformanceCueLoopActionViewModel[];
  placementSecond: number;
  beatLoopHint: string;
  beatLoopActions: TrackPerformanceCueLoopPresetViewModel[];
  onSetQuantizeEnabled: (updater: (value: boolean) => boolean) => void;
  onUpdatePerformance: (input: { mainCueSecond?: number | null }) => void | Promise<void>;
  onAddCue: (kind: "hot" | "memory") => void | Promise<void>;
  onAddSavedLoop: (beatCount: number) => void | Promise<void>;
}

export function TrackPerformancePrimaryActions({
  playheadHint,
  quantizeEnabled,
  quantizeAvailable,
  quantizeToggleLabel,
  actions,
  placementSecond,
  beatLoopHint,
  beatLoopActions,
  onSetQuantizeEnabled,
  onUpdatePerformance,
  onAddCue,
  onAddSavedLoop,
}: TrackPerformancePrimaryActionsProps) {
  return (
    <>
      <p className="support-copy top-spaced">{playheadHint}</p>
      <div className="pill-strip top-spaced">
        <span>
          <button
            type="button"
            className="compact-action"
            aria-pressed={quantizeEnabled && quantizeAvailable}
            disabled={!quantizeAvailable}
            onClick={() => onSetQuantizeEnabled((value) => !value)}
          >
            {quantizeToggleLabel}
          </button>
        </span>
        <span>
          <button
            type="button"
            className="compact-action"
            disabled={actions[0]?.disabled}
            onClick={() =>
              void onUpdatePerformance({
                mainCueSecond: placementSecond,
              })
            }
          >
            {actions[0]?.label}
          </button>
        </span>
        <span>
          <button
            type="button"
            className="compact-action"
            disabled={actions[1]?.disabled}
            onClick={() =>
              void onUpdatePerformance({
                mainCueSecond: null,
              })
            }
          >
            {actions[1]?.label}
          </button>
        </span>
        <span>
          <button
            type="button"
            className="compact-action"
            disabled={actions[2]?.disabled}
            onClick={() => void onAddCue("hot")}
          >
            {actions[2]?.label}
          </button>
        </span>
        <span>
          <button
            type="button"
            className="compact-action"
            disabled={actions[3]?.disabled}
            onClick={() => void onAddCue("memory")}
          >
            {actions[3]?.label}
          </button>
        </span>
      </div>

      <p className="support-copy top-spaced">{beatLoopHint}</p>
      <div className="pill-strip top-spaced">
        {beatLoopActions.map((action) => (
          <span key={action.beatCount}>
            <button
              type="button"
              className="compact-action"
              disabled={action.disabled}
              onClick={() => void onAddSavedLoop(action.beatCount)}
            >
              {action.label}
            </button>
          </span>
        ))}
      </div>
    </>
  );
}
