export function resolveWaveformAnchorDragSecond(input: {
  clientX: number;
  resolveSecondFromClientX: (clientX: number) => number | null;
}): number | null {
  return input.resolveSecondFromClientX(input.clientX);
}

export function buildWaveformAnchorDragCommit(input: { dragAnchorSecond: number | null }): {
  shouldCommit: boolean;
  second: number | null;
} {
  return {
    shouldCommit: input.dragAnchorSecond !== null,
    second: input.dragAnchorSecond,
  };
}
