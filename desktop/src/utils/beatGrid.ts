import type {
  BeatGridPoint,
  BpmCurvePoint,
  UpdateTrackAnalysisInput,
} from "../types/library";

export interface BeatGridPhraseRange {
  startSecond: number;
  endSecond: number;
  startBeatIndex: number;
  endBeatIndex: number;
  beatCount: number;
  label: string;
}

export interface BeatGridGuideMarker {
  index: number;
  second: number;
  emphasis: "beat" | "bar" | "phrase";
  label: string;
}

function round3(value: number): number {
  return Number(value.toFixed(3));
}

export function isEditableBpm(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 40 && value <= 240;
}

export function resolveBeatDurationSeconds(
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] = [],
): number | null {
  if (isEditableBpm(bpm)) {
    return 60 / bpm;
  }

  if (beatGrid.length > 1) {
    const spacing = beatGrid[1]!.second - beatGrid[0]!.second;
    if (spacing > 0 && Number.isFinite(spacing)) {
      return spacing;
    }
  }

  return null;
}

export function normalizeBeatGrid(
  beatGrid: readonly BeatGridPoint[],
  durationSeconds: number | null,
): BeatGridPoint[] {
  const maxDuration =
    typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : Number.POSITIVE_INFINITY;

  return [...beatGrid]
    .filter(
      (point) =>
        Number.isFinite(point.second) &&
        point.second >= 0 &&
        point.second <= maxDuration,
    )
    .sort((left, right) => left.second - right.second)
    .filter((point, index, list) =>
      index === 0 || Math.abs(point.second - list[index - 1]!.second) > 0.0005,
    )
    .map((point, index) => ({
      index,
      second: round3(point.second),
    }));
}

export function buildBeatGridFromAnchor(
  bpm: number,
  durationSeconds: number | null,
  anchorSecond: number,
): BeatGridPoint[] {
  if (!isEditableBpm(bpm) || typeof durationSeconds !== "number" || durationSeconds <= 0) {
    return [];
  }

  const beatDuration = 60 / bpm;
  const clampedAnchor = Math.min(Math.max(anchorSecond, 0), durationSeconds);
  const beatsBeforeAnchor = Math.floor(clampedAnchor / beatDuration);
  const firstBeatSecond = round3(clampedAnchor - beatsBeforeAnchor * beatDuration);
  const totalBeats = Math.max(1, Math.floor((durationSeconds - firstBeatSecond) / beatDuration));

  const beatGrid = Array.from({ length: totalBeats + 1 }, (_, index) => ({
    index,
    second: round3(firstBeatSecond + index * beatDuration),
  }));

  return normalizeBeatGrid(beatGrid, durationSeconds);
}

export function shiftBeatGrid(
  beatGrid: readonly BeatGridPoint[],
  offsetSeconds: number,
  durationSeconds: number | null,
): BeatGridPoint[] {
  if (!Number.isFinite(offsetSeconds) || offsetSeconds === 0) {
    return normalizeBeatGrid(beatGrid, durationSeconds);
  }

  return normalizeBeatGrid(
    beatGrid.map((point) => ({
      ...point,
      second: point.second + offsetSeconds,
    })),
    durationSeconds,
  );
}

export function resolveBeatGridAnchorSecond(
  beatGrid: readonly BeatGridPoint[],
  fallbackSecond = 0,
): number {
  if (beatGrid.length === 0) {
    return round3(Math.max(0, fallbackSecond));
  }

  return round3(Math.max(0, beatGrid[0]!.second));
}

export function buildFlatBpmCurve(
  bpm: number,
  durationSeconds: number | null,
): BpmCurvePoint[] {
  if (!isEditableBpm(bpm) || typeof durationSeconds !== "number" || durationSeconds <= 0) {
    return [];
  }

  const stepSeconds = durationSeconds > 120 ? 30 : durationSeconds > 60 ? 15 : 8;
  const points: BpmCurvePoint[] = [];
  let second = 0;

  while (second < durationSeconds) {
    points.push({
      second: round3(second),
      bpm: round3(bpm),
    });
    second += stepSeconds;
  }

  points.push({
    second: round3(durationSeconds),
    bpm: round3(bpm),
  });

  return points.filter(
    (point, index, list) =>
      index === 0 || Math.abs(point.second - list[index - 1]!.second) > 0.0005,
  );
}

export function nudgeBeatGridByBeats(
  beatGrid: readonly BeatGridPoint[],
  bpm: number | null | undefined,
  beatDelta: number,
  durationSeconds: number | null,
): BeatGridPoint[] {
  const beatDuration = resolveBeatDurationSeconds(bpm, beatGrid);
  if (beatDuration === null) {
    return normalizeBeatGrid(beatGrid, durationSeconds);
  }

  return shiftBeatGrid(beatGrid, beatDuration * beatDelta, durationSeconds);
}

export function createAnchoredBeatGridUpdate(
  bpm: number,
  durationSeconds: number | null,
  anchorSecond: number,
): UpdateTrackAnalysisInput {
  return {
    bpm,
    beatGrid: buildBeatGridFromAnchor(bpm, durationSeconds, anchorSecond),
    bpmCurve: buildFlatBpmCurve(bpm, durationSeconds),
  };
}

export function createNudgedBeatGridUpdate(
  beatGrid: readonly BeatGridPoint[],
  bpm: number,
  beatDelta: number,
  durationSeconds: number | null,
): UpdateTrackAnalysisInput {
  return {
    bpm,
    beatGrid: nudgeBeatGridByBeats(beatGrid, bpm, beatDelta, durationSeconds),
    bpmCurve: buildFlatBpmCurve(bpm, durationSeconds),
  };
}

export function selectBeatGridPhrase(
  second: number,
  beatGrid: readonly BeatGridPoint[],
  durationSeconds: number | null,
  beatCount = 16,
): BeatGridPhraseRange | null {
  if (!Number.isFinite(second) || beatCount <= 0) {
    return null;
  }

  const normalizedGrid = normalizeBeatGrid(beatGrid, durationSeconds);
  if (normalizedGrid.length < 2) {
    return null;
  }

  let nearestPoint = normalizedGrid[0]!;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of normalizedGrid) {
    const distance = Math.abs(point.second - second);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = point;
    }
  }

  const startBeatIndex = Math.floor(nearestPoint.index / beatCount) * beatCount;
  const startPoint =
    normalizedGrid.find((point) => point.index === startBeatIndex) ??
    normalizedGrid[startBeatIndex] ??
    normalizedGrid[0]!;
  const explicitEndPoint =
    normalizedGrid.find((point) => point.index === startBeatIndex + beatCount) ??
    normalizedGrid[startBeatIndex + beatCount];
  const lastPoint = normalizedGrid[normalizedGrid.length - 1]!;
  const beatDuration = resolveBeatDurationSeconds(null, normalizedGrid);
  const maxDuration =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : lastPoint.second;
  const endSecond = explicitEndPoint
    ? explicitEndPoint.second
    : beatDuration !== null
      ? Math.min(maxDuration, startPoint.second + beatDuration * beatCount)
      : maxDuration;

  if (!(endSecond > startPoint.second)) {
    return null;
  }

  return {
    startSecond: round3(startPoint.second),
    endSecond: round3(endSecond),
    startBeatIndex,
    endBeatIndex: startBeatIndex + beatCount,
    beatCount,
    label: `Phrase ${Math.floor(startBeatIndex / beatCount) + 1}`,
  };
}

export function deriveBeatGridGuideMarkers(
  beatGrid: readonly BeatGridPoint[],
  durationSeconds: number | null,
  options?: {
    barBeatCount?: number;
    phraseBeatCount?: number;
  },
): BeatGridGuideMarker[] {
  const normalizedGrid = normalizeBeatGrid(beatGrid, durationSeconds);
  if (normalizedGrid.length === 0) {
    return [];
  }

  const barBeatCount = Math.max(1, options?.barBeatCount ?? 4);
  const phraseBeatCount = Math.max(barBeatCount, options?.phraseBeatCount ?? 16);

  return normalizedGrid.map((point) => {
    const isPhrase = point.index % phraseBeatCount === 0;
    const isBar = point.index % barBeatCount === 0;
    const emphasis = isPhrase ? "phrase" : isBar ? "bar" : "beat";
    const label =
      emphasis === "phrase"
        ? `Phrase ${Math.floor(point.index / phraseBeatCount) + 1}`
        : emphasis === "bar"
          ? `Bar ${Math.floor(point.index / barBeatCount) + 1}`
          : `Beat ${point.index + 1}`;

    return {
      index: point.index,
      second: point.second,
      emphasis,
      label,
    };
  });
}
