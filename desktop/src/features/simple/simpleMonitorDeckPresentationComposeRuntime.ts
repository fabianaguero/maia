export function buildSimpleMonitorDeckPresentationStateResult<TTailState, TVisualState>(input: {
  tailState: TTailState;
  visualState: TVisualState;
}): TTailState & TVisualState {
  return {
    ...input.tailState,
    ...input.visualState,
  };
}
