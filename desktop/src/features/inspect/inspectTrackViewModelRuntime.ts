import type { AppTranslations } from "../../i18n/en";
import type { LibraryTrack } from "../../types/library";
import {
  getTrackWaveformCues,
  getTrackWaveformRegions,
  hasUsableBeatGrid,
} from "../../utils/track";
import {
  buildInspectTrackMetadataDetails,
  buildInspectTrackSummaryPills,
  buildInspectTrackTabViewModel,
  buildInspectTrackWaveformModel,
} from "./inspectTrackViewRuntime";

export function buildInspectTrackViewModel(input: {
  track: LibraryTrack;
  trackMutating: boolean;
  t: AppTranslations;
}) {
  const waveformModel = buildInspectTrackWaveformModel({
    track: input.track,
    trackMutating: input.trackMutating,
  });

  return {
    tabs: buildInspectTrackTabViewModel(input.t),
    summaryPills: buildInspectTrackSummaryPills(input.track, input.t),
    metadataDetails: buildInspectTrackMetadataDetails(input.track, input.t),
    waveformModel,
    waveformCues: getTrackWaveformCues(input.track),
    waveformRegions: getTrackWaveformRegions(input.track),
    canSelectPhrase: hasUsableBeatGrid(input.track.analysis.beatGrid),
    resetKey: JSON.stringify({
      id: input.track.id,
      beatGridLength: input.track.analysis.beatGrid.length,
      firstBeatSecond: input.track.analysis.beatGrid[0]?.second ?? null,
      durationSeconds: input.track.analysis.durationSeconds ?? null,
    }),
  };
}

export type InspectTrackViewModel = ReturnType<typeof buildInspectTrackViewModel>;
