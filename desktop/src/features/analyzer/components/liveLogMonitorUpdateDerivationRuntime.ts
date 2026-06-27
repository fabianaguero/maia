import type { LibraryTrack, LiveLogStreamUpdate } from "../../../types/library";
import {
  deriveLiveMutationExplanations,
  type LiveMutationExplanation,
} from "../../../utils/liveMutationExplainability";
import { getTrackTitle } from "../../../utils/track";
import {
  mergeKnownMonitorComponents,
} from "./liveLogMonitorStreamUpdateRuntime";
import {
  routeCueThroughScene,
  type ComponentOverride,
  type ResolvedLiveSonificationScene,
  type RoutedLiveCue,
} from "./liveSonificationScene";

export interface MonitorUpdateDerivation {
  knownComponents: string[];
  knownComponentsChanged: boolean;
  routedCues: RoutedLiveCue[];
  currentTrack: LibraryTrack | null;
  nextExplanations: LiveMutationExplanation[];
  primaryLine: string;
}

export function buildMonitorUpdateDerivation(input: {
  update: LiveLogStreamUpdate;
  scene: ResolvedLiveSonificationScene;
  knownComponents: string[];
  componentOverrides: ReadonlyMap<string, ComponentOverride>;
  currentDeckTrackId: string | null;
  availableTracks: LibraryTrack[];
  currentTrackSecond: number | null;
  maxRecentExplanations: number;
}): MonitorUpdateDerivation {
  const mergedComponents = mergeKnownMonitorComponents(
    input.knownComponents,
    input.update.topComponents.map((component) => component.component),
    12,
  );

  const routedCues = input.update.sonificationCues.map((cue, index) =>
    routeCueThroughScene(
      cue,
      input.scene,
      index,
      mergedComponents.knownComponents,
      input.componentOverrides,
    ),
  );
  const currentTrack =
    input.currentDeckTrackId === null
      ? null
      : (input.availableTracks.find((track) => track.id === input.currentDeckTrackId) ?? null);
  const nextExplanations = deriveLiveMutationExplanations(
    routedCues,
    input.update.anomalyMarkers,
    {
      limit: input.maxRecentExplanations,
      replayWindowIndex: input.update.replayWindowIndex ?? null,
      trackId: currentTrack?.id ?? null,
      trackTitle: currentTrack ? getTrackTitle(currentTrack) : null,
      trackSecond: input.currentTrackSecond,
    },
  );

  return {
    knownComponents: mergedComponents.knownComponents,
    knownComponentsChanged: mergedComponents.changed,
    routedCues,
    currentTrack,
    nextExplanations,
    primaryLine: input.update.parsedLines?.[input.update.parsedLines.length - 1] || "",
  };
}
