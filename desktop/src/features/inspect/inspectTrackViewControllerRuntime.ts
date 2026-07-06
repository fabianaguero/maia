import type { ManagedAudioCueRequest } from "../analyzer/components/ManagedAudioPlayer";
import type { TrackCompareAuditionPoint } from "../../utils/track";

export interface InspectTrackCompareAuditionViewState {
  currentTime: number;
  activeCompareAuditionId: TrackCompareAuditionPoint["id"];
  activeCompareAuditionLabel: string;
  cueRequest: ManagedAudioCueRequest;
}

export function buildInspectTrackCompareAuditionViewState(input: {
  previousCueRequest: ManagedAudioCueRequest | null;
  point: TrackCompareAuditionPoint;
}): InspectTrackCompareAuditionViewState {
  return {
    currentTime: input.point.second,
    activeCompareAuditionId: input.point.id,
    activeCompareAuditionLabel: input.point.label,
    cueRequest: {
      id: (input.previousCueRequest?.id ?? 0) + 1,
      second: input.point.second,
      autoplay: true,
    },
  };
}
