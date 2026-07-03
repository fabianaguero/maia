import type {
  BuildWaveformPlaceholderViewModelInput,
  WaveformPlaceholderDerivedViewModel,
  WaveformPlaceholderInteractionState,
} from "./waveformPlaceholderViewModelTypes";
import { buildWaveformPlaceholderDerivedState } from "./waveformPlaceholderDerivedStateRuntime";
import { buildWaveformPlaceholderVisualState } from "./waveformPlaceholderVisualStateRuntime";

export type {
  BuildWaveformPlaceholderViewModelInput,
  WaveformPlaceholderDerivedViewModel,
  WaveformPlaceholderInteractionState,
};

export function buildWaveformPlaceholderViewModel(
  input: BuildWaveformPlaceholderViewModelInput,
): WaveformPlaceholderDerivedViewModel {
  const derivedState = buildWaveformPlaceholderDerivedState(input);
  const visualState = buildWaveformPlaceholderVisualState({
    ...input,
    ...derivedState,
  });

  return {
    ...derivedState,
    ...visualState,
  };
}
