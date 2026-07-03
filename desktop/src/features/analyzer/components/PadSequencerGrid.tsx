import { useT } from "../../../i18n/I18nContext";
import type {
  PadSequencerRulerCellViewModel,
  PadSequencerTrackRowViewModel,
} from "./padSequencerPanelRuntime";

interface PadSequencerGridProps {
  rulerCells: PadSequencerRulerCellViewModel[];
  trackRows: PadSequencerTrackRowViewModel[];
  onToggleStep: (trackIdx: number, stepIdx: number) => void;
  onCycleProbability: (trackIdx: number, stepIdx: number) => void;
}

export function PadSequencerGrid({
  rulerCells,
  trackRows,
  onToggleStep,
  onCycleProbability,
}: PadSequencerGridProps) {
  const t = useT();

  return (
    <div className="pad-sequencer-grid">
      <div className="pad-seq-row pad-seq-ruler-row">
        <span className="pad-seq-track-label" aria-hidden="true" />
        {rulerCells.map((cell) => (
          <span
            key={cell.key}
            className={`pad-seq-ruler-cell ${cell.isBeat ? "pad-seq-ruler-cell--beat" : ""} ${cell.isActive ? "pad-seq-ruler-cell--active" : ""}`}
          >
            {cell.label}
          </span>
        ))}
      </div>

      {trackRows.map((row) => (
        <div key={row.track} className={row.className}>
          <span className="pad-seq-track-label">{row.track}</span>
          {row.steps.map((step) => (
            <button
              key={step.key}
              type="button"
              className={step.className}
              style={step.style}
              onClick={() => onToggleStep(row.trackIndex, step.step)}
              onContextMenu={(event) => {
                event.preventDefault();
                if (step.isOn) {
                  onCycleProbability(row.trackIndex, step.step);
                }
              }}
              aria-pressed={step.isOn}
              aria-label={t.inspect.trackStepAria
                .replace("{track}", row.track)
                .replace("{step}", String(step.step + 1))
                .replace(
                  "{probability}",
                  step.isOn && step.probability < 100
                    ? t.inspect.probabilitySuffix.replace("{prob}", String(step.probability))
                    : "",
                )}
              title={
                step.isOn
                  ? step.probability < 100
                    ? t.inspect.rightClickCycleProbability.replace(
                        "{prob}",
                        String(step.probability),
                      )
                    : t.inspect.rightClickSetProbability
                  : t.inspect.leftClickEnable
              }
            >
              {step.isOn && step.probability < 100 ? (
                <span className="pad-seq-step-prob">{step.probability}</span>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
