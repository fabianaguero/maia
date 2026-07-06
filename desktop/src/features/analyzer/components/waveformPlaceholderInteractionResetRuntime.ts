export interface WaveformInteractionResetState {
  resetBeatGridEditing: boolean;
  resetPhraseSelection: boolean;
  resetPerformanceDragging: boolean;
}

export function buildWaveformPlaceholderInteractionResetState(input: {
  canEditBeatGrid: boolean;
  canSelectPhrase: boolean;
  canEditPerformance: boolean;
}): WaveformInteractionResetState {
  return {
    resetBeatGridEditing: !input.canEditBeatGrid,
    resetPhraseSelection: !input.canSelectPhrase,
    resetPerformanceDragging: !input.canEditPerformance,
  };
}
