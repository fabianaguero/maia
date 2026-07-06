import { useT } from "../../../i18n/I18nContext";

interface PadSequencerHeaderProps {
  effectiveBpm: number;
  playing: boolean;
  humanizeMs: number;
  onTogglePlaying: () => void;
  onFillFromScene: () => void;
  onClear: () => void;
  onChangeHumanizeMs: (value: number) => void;
}

export function PadSequencerHeader({
  effectiveBpm,
  playing,
  humanizeMs,
  onTogglePlaying,
  onFillFromScene,
  onClear,
  onChangeHumanizeMs,
}: PadSequencerHeaderProps) {
  const t = useT();

  return (
    <div className="pad-sequencer-header">
      <div className="pad-sequencer-meta">
        <span className="pad-sequencer-bpm">{Math.round(effectiveBpm)} BPM</span>
        <span className="pad-sequencer-steps">{t.inspect.stepsBarLabel}</span>
      </div>
      <div className="pad-sequencer-controls">
        <button
          type="button"
          className={`pad-seq-btn ${playing ? "pad-seq-btn--active" : ""}`}
          onClick={onTogglePlaying}
          title={playing ? t.inspect.stopPlayhead : t.inspect.startPlayhead}
        >
          {playing ? `■ ${t.inspect.stopAction}` : `▶ ${t.inspect.playAction}`}
        </button>
        <button
          type="button"
          className="pad-seq-btn"
          onClick={onFillFromScene}
          title={t.inspect.seedPatternFromLastVoices}
        >
          {t.inspect.fillFromScene}
        </button>
        <button
          type="button"
          className="pad-seq-btn pad-seq-btn--danger"
          onClick={onClear}
          title={t.inspect.clearAllSteps}
        >
          {t.inspect.clearAction}
        </button>
        <label className="pad-seq-humanize-label" title={t.inspect.humanizeTitle}>
          {t.inspect.humanize}
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={humanizeMs}
            onChange={(event) => onChangeHumanizeMs(Number(event.target.value))}
            className="pad-seq-humanize-range"
          />
          <span className="pad-seq-humanize-value">
            {humanizeMs > 0 ? `±${humanizeMs}ms` : t.inspect.humanizeOff}
          </span>
        </label>
      </div>
    </div>
  );
}
