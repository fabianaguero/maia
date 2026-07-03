import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import type { AppTranslations } from "../../../i18n/en";
import type { TrackPerformanceCueLoopPhraseViewModel } from "./trackPerformanceCueLoopSectionRuntime";

interface TrackPerformancePhraseActionsProps {
  selectedPhraseRange: BeatGridPhraseRange | null;
  phraseView: TrackPerformanceCueLoopPhraseViewModel | null;
  onUpdatePerformance: (input: { mainCueSecond?: number | null }) => void | Promise<void>;
  onAddPhraseMemoryCue: () => void | Promise<void>;
  onAddSelectedPhraseLoop: () => void | Promise<void>;
  t: AppTranslations;
}

export function TrackPerformancePhraseActions({
  selectedPhraseRange,
  phraseView,
  onUpdatePerformance,
  onAddPhraseMemoryCue,
  onAddSelectedPhraseLoop,
  t,
}: TrackPerformancePhraseActionsProps) {
  if (selectedPhraseRange && phraseView) {
    return (
      <>
        <p className="support-copy top-spaced">{phraseView.selectionSummary}</p>
        <div className="pill-strip top-spaced">
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={phraseView.actions[0]?.disabled}
              onClick={() =>
                void onUpdatePerformance({
                  mainCueSecond: selectedPhraseRange.startSecond,
                })
              }
            >
              {phraseView.actions[0]?.label}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={phraseView.actions[1]?.disabled}
              onClick={() => void onAddPhraseMemoryCue()}
            >
              {phraseView.actions[1]?.label}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={phraseView.actions[2]?.disabled}
              onClick={() => void onAddSelectedPhraseLoop()}
            >
              {phraseView.actions[2]?.label}
            </button>
          </span>
        </div>
      </>
    );
  }

  return (
    <p className="support-copy top-spaced">
      {phraseView?.selectionSummary ?? t.inspect.armPhraseSelect}
    </p>
  );
}
