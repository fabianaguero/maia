interface WaveformPanelHeaderProps {
  title: string;
  copy: string;
  showActions: boolean;
  showGridButton: boolean;
  gridClickArmed: boolean;
  disableGridButton: boolean;
  armDownbeatLabel: string;
  cancelGridClickLabel: string;
  onToggleGridClickArmed: () => void;
  showPhraseButton: boolean;
  phraseSelectArmed: boolean;
  disablePhraseButton: boolean;
  armPhraseSelectLabel: string;
  cancelPhraseSelectLabel: string;
  onTogglePhraseSelectArmed: () => void;
}

export function WaveformPanelHeader({
  title,
  copy,
  showActions,
  showGridButton,
  gridClickArmed,
  disableGridButton,
  armDownbeatLabel,
  cancelGridClickLabel,
  onToggleGridClickArmed,
  showPhraseButton,
  phraseSelectArmed,
  disablePhraseButton,
  armPhraseSelectLabel,
  cancelPhraseSelectLabel,
  onTogglePhraseSelectArmed,
}: WaveformPanelHeaderProps) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p className="support-copy">{copy}</p>
      </div>
      {showActions ? (
        <div className="waveform-panel-actions">
          {showGridButton ? (
            <button
              type="button"
              className={`compact-action${gridClickArmed ? " waveform-grid-arm-active" : ""}`}
              disabled={disableGridButton}
              onClick={onToggleGridClickArmed}
            >
              {gridClickArmed ? cancelGridClickLabel : armDownbeatLabel}
            </button>
          ) : null}
          {showPhraseButton ? (
            <button
              type="button"
              className={`compact-action${phraseSelectArmed ? " waveform-grid-arm-active" : ""}`}
              disabled={disablePhraseButton}
              onClick={onTogglePhraseSelectArmed}
            >
              {phraseSelectArmed ? cancelPhraseSelectLabel : armPhraseSelectLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
