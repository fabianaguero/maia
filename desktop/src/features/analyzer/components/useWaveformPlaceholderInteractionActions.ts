import { useWaveformPlaceholderDragActions } from "./useWaveformPlaceholderDragActions";
import { useWaveformPlaceholderPrimaryActions } from "./useWaveformPlaceholderPrimaryActions";
import type { UseWaveformPlaceholderInteractionActionsInput } from "./useWaveformPlaceholderInteractionActionsTypes";

export function useWaveformPlaceholderInteractionActions(
  input: UseWaveformPlaceholderInteractionActionsInput,
) {
  const primaryActions = useWaveformPlaceholderPrimaryActions(input);
  const dragActions = useWaveformPlaceholderDragActions(input);

  return {
    ...primaryActions,
    ...dragActions,
  };
}
