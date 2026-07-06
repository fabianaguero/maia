export function clearConnectionTailPollTimer(
  timerId: number | null,
  clearTimeoutFn: (timerId: number) => void = window.clearTimeout,
): null {
  if (timerId !== null) {
    clearTimeoutFn(timerId);
  }

  return null;
}

export function scheduleConnectionTailPollTimer(input: {
  delayMs: number;
  run: () => void;
  setTimeoutFn?: (handler: TimerHandler, timeout?: number) => number;
  clearTimeoutFn?: (timerId: number) => void;
  currentTimerId?: number | null;
}): number {
  if (input.currentTimerId !== null && input.currentTimerId !== undefined) {
    (input.clearTimeoutFn ?? window.clearTimeout)(input.currentTimerId);
  }

  return (input.setTimeoutFn ?? window.setTimeout)(input.run, input.delayMs);
}
