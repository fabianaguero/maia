import type { AppTranslations } from "../../../i18n/en";
import type { LibraryTrack } from "../../../types/library";
import {
  formatTrackTime,
  getTrackCompareAuditionPoints,
  getTrackOriginalWaveformCues,
  getTrackWaveformCues,
  getTrackWaveformRegions,
  type TrackCompareAuditionPoint,
} from "../../../utils/track";

export interface TrackOriginalCompareMetricViewModel {
  key: "original-cues" | "altered-cues" | "saved-loops" | "delta" | "main-cue";
  label: string;
  value: string;
}

export interface TrackOriginalCompareAuditionViewModel {
  id: TrackCompareAuditionPoint["id"];
  label: string;
  detail: string;
  second: number;
  formattedTime: string;
  active: boolean;
  ariaLabel: string;
}

export function countAlteredCueMarkers(track: LibraryTrack): number {
  const mainCueCount = track.performance.mainCueSecond !== null ? 1 : 0;
  return mainCueCount + track.performance.hotCues.length + track.performance.memoryCues.length;
}

export function buildTrackOriginalComparePanelViewModel(input: {
  track: LibraryTrack;
  activeAuditionId: TrackCompareAuditionPoint["id"] | null;
  t: AppTranslations;
}) {
  const originalCues = getTrackOriginalWaveformCues(input.track);
  const alteredCues = getTrackWaveformCues(input.track);
  const alteredRegions = getTrackWaveformRegions(input.track);
  const auditionPoints = getTrackCompareAuditionPoints(input.track);
  const alteredCueCount = countAlteredCueMarkers(input.track);
  const cueDelta = alteredCueCount - originalCues.length;

  return {
    originalCues,
    alteredCues,
    alteredRegions,
    metrics: [
      {
        key: "original-cues",
        label: input.t.inspect.originalCues,
        value: String(originalCues.length),
      },
      {
        key: "altered-cues",
        label: input.t.inspect.alteredCues,
        value: String(alteredCueCount),
      },
      {
        key: "saved-loops",
        label: input.t.inspect.savedLoops,
        value: String(alteredRegions.length),
      },
      {
        key: "delta",
        label: input.t.inspect.delta,
        value: cueDelta >= 0 ? `+${cueDelta}` : String(cueDelta),
      },
      {
        key: "main-cue",
        label: input.t.inspect.mainCue,
        value: formatTrackTime(input.track.performance.mainCueSecond, input.t.inspect.pending),
      },
    ] satisfies TrackOriginalCompareMetricViewModel[],
    auditions: auditionPoints.map((point) => ({
      id: point.id,
      label: point.label,
      detail: point.detail,
      second: point.second,
      formattedTime: formatTrackTime(point.second, input.t.inspect.pending),
      active: input.activeAuditionId === point.id,
      ariaLabel: input.t.inspect.audition.replace("{label}", point.label),
    })) satisfies TrackOriginalCompareAuditionViewModel[],
  };
}
