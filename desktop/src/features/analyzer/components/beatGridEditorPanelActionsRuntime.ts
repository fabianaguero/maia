import type { LibraryTrack, UpdateTrackAnalysisInput } from "../../../types/library";
import {
  createAnchoredBeatGridUpdate,
  createNudgedBeatGridUpdate,
  isEditableBpm,
  resolveBeatGridAnchorSecond,
} from "../../../utils/beatGrid";

export function createBeatGridEditorActions(input: {
  track: LibraryTrack;
  currentTime: number;
  parsedBpm: number | null;
  effectiveBpm: number | null;
  canPersist: boolean;
  onUpdateAnalysis?: ((update: UpdateTrackAnalysisInput) => Promise<void>) | undefined;
}) {
  const { track, currentTime, parsedBpm, effectiveBpm, canPersist, onUpdateAnalysis } = input;
  const durationSeconds = track.analysis.durationSeconds;
  const beatGrid = track.analysis.beatGrid;

  const updateAnalysis = (update: UpdateTrackAnalysisInput | null) => {
    if (!canPersist || !update) {
      return;
    }

    return onUpdateAnalysis?.(update);
  };

  return {
    applyBpm: () =>
      updateAnalysis(
        isEditableBpm(parsedBpm)
          ? createAnchoredBeatGridUpdate(
              parsedBpm,
              durationSeconds,
              resolveBeatGridAnchorSecond(beatGrid, currentTime),
            )
          : null,
      ),
    setDownbeatHere: () =>
      updateAnalysis(
        isEditableBpm(effectiveBpm)
          ? createAnchoredBeatGridUpdate(effectiveBpm, durationSeconds, currentTime)
          : null,
      ),
    nudgeGrid: (beatDelta: number) =>
      updateAnalysis(
        isEditableBpm(effectiveBpm)
          ? createNudgedBeatGridUpdate(beatGrid, effectiveBpm, beatDelta, durationSeconds)
          : null,
      ),
    scaleBpm: (factor: number) => {
      if (!isEditableBpm(effectiveBpm)) {
        return null;
      }

      const nextBpm = effectiveBpm * factor;
      if (!isEditableBpm(nextBpm)) {
        return null;
      }

      return {
        nextBpm,
        update: createAnchoredBeatGridUpdate(
          nextBpm,
          durationSeconds,
          resolveBeatGridAnchorSecond(beatGrid, currentTime),
        ),
      };
    },
    updateAnalysis,
  };
}
