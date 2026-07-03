import type { LiveLogMarker } from "../../../types/library";
import type { ArrangementTrack, ArrangementVoice } from "./liveSonificationScene";

export const ARRANGEMENT_TRACKS: ArrangementTrack[] = ["foundation", "motion", "accent"];

export interface ArrangementLaneViewModel {
  track: ArrangementTrack;
  voices: ArrangementVoice[];
}

export function buildArrangementLanes(
  recentVoices: ArrangementVoice[],
): ArrangementLaneViewModel[] {
  return ARRANGEMENT_TRACKS.map((track) => ({
    track,
    voices: recentVoices.filter((voice) => voice.track === track),
  }));
}

export function hasMonitorNotes(error: string | null, recentWarnings: string[]): boolean {
  return Boolean(error) || recentWarnings.length > 0;
}

export function markerKey(marker: LiveLogMarker): string {
  return `${marker.eventIndex}-${marker.component}-${marker.level}`;
}
