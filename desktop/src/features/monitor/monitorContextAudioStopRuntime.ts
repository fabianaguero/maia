import type { MutableRefObject } from "react";

import type { CrossfadeHandle } from "./monitorAudioRuntimeTypes";

export function stopCrossfadeEngine(
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>,
  audioContextRef: MutableRefObject<AudioContext | null>,
  activeSourcesRef: MutableRefObject<AudioBufferSourceNode[]>,
): void {
  const ctx = audioContextRef.current;
  if (!ctx) return;

  const current = currentSegmentRef.current;
  if (current && ctx.state === "running") {
    try {
      const now = ctx.currentTime;
      current.gainNode.gain.cancelScheduledValues(now);
      current.gainNode.gain.setValueAtTime(current.gainNode.gain.value, now);
      current.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
      current.source.stop(now + 0.05);
    } catch {
      // ignore
    }
  }
  currentSegmentRef.current = null;

  const now = ctx.currentTime;
  activeSourcesRef.current.forEach((source) => {
    try {
      source.stop(now);
    } catch {
      // ignore
    }
  });
  activeSourcesRef.current = [];
}
