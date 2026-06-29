import type { LiveLogMarker } from "../../../types/library";
import type { MutationArrangementDepth } from "../../../types/music";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import {
  resolveArrangementVoices,
  type ArrangementVoice,
  type RoutedLiveCue,
} from "./liveSonificationScene";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";

export function mergeKnownMonitorComponents(
  current: string[],
  nextComponents: string[],
  maxComponents: number,
): { knownComponents: string[]; changed: boolean } {
  const merged = [...current];
  let changed = false;

  for (const component of nextComponents) {
    if (!merged.includes(component)) {
      merged.push(component);
      changed = true;
    }
  }

  return {
    knownComponents: merged.slice(0, maxComponents),
    changed,
  };
}

export function buildRecentCueHistory(
  current: RoutedLiveCue[],
  routedCues: RoutedLiveCue[],
  primaryLine: string,
  maxCues: number,
): RoutedLiveCue[] {
  return [
    ...routedCues
      .slice()
      .reverse()
      .map((cue) => ({
        ...cue,
        logLine: primaryLine,
      })),
    ...current,
  ].slice(0, maxCues);
}

export function buildRecentMarkerHistory(
  current: LiveLogMarker[],
  markers: LiveLogMarker[],
  maxMarkers: number,
): LiveLogMarker[] {
  return [...markers.slice().reverse(), ...current].slice(0, maxMarkers);
}

export function buildRecentExplanationHistory(
  current: LiveMutationExplanation[],
  explanations: LiveMutationExplanation[],
  maxExplanations: number,
): LiveMutationExplanation[] {
  return [...explanations.slice().reverse(), ...current].slice(0, maxExplanations);
}

export function resolveSelectedMonitorExplanationId(
  current: string | null,
  explanations: LiveMutationExplanation[],
  isPlayback: boolean,
): string | null {
  const firstExplanation = explanations[0];
  if (!firstExplanation) {
    return current;
  }

  return isPlayback ? firstExplanation.id : (current ?? firstExplanation.id);
}

export function buildRecentMonitorVoices(
  routedCues: RoutedLiveCue[],
  arrangementDepth: MutationArrangementDepth,
  maxVoices: number,
): ArrangementVoice[] {
  return resolveArrangementVoices(routedCues, arrangementDepth).slice(0, maxVoices);
}

export function resolveActiveTailWindowId(nextTailRows: SyncTailRow[]): string | null {
  return nextTailRows[0]?.windowId ?? null;
}
