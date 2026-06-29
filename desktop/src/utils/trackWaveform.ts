import type {
  LibraryTrack,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../types/library";

export interface TrackCompareAuditionPoint {
  id: "original" | "altered" | "loop";
  label: string;
  detail: string;
  second: number;
}

export function getTrackWaveformCues(track: LibraryTrack): VisualizationCuePoint[] {
  const performanceCues = [
    ...track.performance.hotCues.map((cue) => ({
      second: cue.second,
      label: cue.label,
      type: cue.kind,
      excerpt: cue.slot !== null ? `Slot ${cue.slot}` : undefined,
    })),
    ...track.performance.memoryCues.map((cue) => ({
      second: cue.second,
      label: cue.label,
      type: cue.kind,
      excerpt: cue.slot !== null ? `Slot ${cue.slot}` : undefined,
    })),
  ];

  const mainCue =
    typeof track.performance.mainCueSecond === "number" &&
    !performanceCues.some((cue) => Math.abs(cue.second - track.performance.mainCueSecond!) < 0.001)
      ? [
          {
            second: track.performance.mainCueSecond,
            label: "Main",
            type: "main",
            excerpt: "Main cue",
          } satisfies VisualizationCuePoint,
        ]
      : [];

  const cues =
    performanceCues.length > 0 || mainCue.length > 0
      ? [...mainCue, ...performanceCues]
      : (track.visualization?.hotCues ?? []);

  return [...cues].sort((left, right) => left.second - right.second);
}

export function getTrackOriginalWaveformCues(track: LibraryTrack): VisualizationCuePoint[] {
  return [...(track.visualization?.hotCues ?? [])].sort(
    (left, right) => left.second - right.second,
  );
}

export function getTrackWaveformRegions(track: LibraryTrack): VisualizationRegionPoint[] {
  return [...track.performance.savedLoops]
    .sort((left, right) => left.startSecond - right.startSecond)
    .map((loop) => ({
      id: loop.id,
      startSecond: loop.startSecond,
      endSecond: loop.endSecond,
      label: loop.label,
      type: "loop",
      color: loop.color,
      excerpt: [
        loop.slot !== null ? `Slot ${loop.slot}` : "Loop",
        loop.locked ? "Locked" : "Editable",
      ].join(" · "),
    }));
}

export function getTrackCompareAuditionPoints(track: LibraryTrack): TrackCompareAuditionPoint[] {
  const originalCues = getTrackOriginalWaveformCues(track);
  const alteredCues = getTrackWaveformCues(track);
  const alteredRegions = getTrackWaveformRegions(track);

  const originalLead = originalCues[0];
  const alteredLead =
    typeof track.performance.mainCueSecond === "number"
      ? {
          second: track.performance.mainCueSecond,
          detail: "Main cue",
        }
      : alteredCues[0]
        ? {
            second: alteredCues[0].second,
            detail: alteredCues[0].label,
          }
        : {
            second: originalLead?.second ?? 0,
            detail: "Track start",
          };

  const points: TrackCompareAuditionPoint[] = [
    {
      id: "original",
      label: "Base cue",
      detail: originalLead?.label ?? "Track start",
      second: originalLead?.second ?? 0,
    },
    {
      id: "altered",
      label: "Mutation cue",
      detail: alteredLead.detail,
      second: alteredLead.second,
    },
  ];

  const firstLoop = alteredRegions[0];
  if (firstLoop) {
    points.push({
      id: "loop",
      label: "Loop window",
      detail: firstLoop.label,
      second: firstLoop.startSecond,
    });
  }

  return points;
}
