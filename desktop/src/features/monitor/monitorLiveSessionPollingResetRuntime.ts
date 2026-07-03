import type { MutableRefObject } from "react";

export function resetLivePollingState(input: {
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollIndexRef: MutableRefObject<number>;
  startFromBeginning?: boolean;
}): void {
  input.directCursorRef.current = input.startFromBeginning ? 0 : undefined;
  input.emptyWindowsRef.current = 0;
  input.pollIndexRef.current = 0;
}
