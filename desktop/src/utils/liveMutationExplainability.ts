import type { LiveLogMarker, VisualizationCuePoint } from "../types/library";

export interface ExplainableLiveCue {
  id: string;
  eventIndex: number;
  level: string;
  component: string;
  excerpt: string;
  noteHz: number;
  durationMs: number;
  gain: number;
  waveform: OscillatorType;
  accent: string;
  routeKey: string;
  routeLabel: string;
  stemLabel: string;
  sectionLabel: string;
  focus: string;
}

export interface LiveMutationExplanation {
  id: string;
  eventIndex: number;
  replayWindowIndex: number | null;
  component: string;
  level: string;
  trackId: string | null;
  trackTitle: string | null;
  trackSecond: number | null;
  sourceExcerpt: string;
  triggerLabel: string;
  triggerDetail: string;
  resultLabel: string;
  resultDetail: string;
  focus: string;
  waveform: OscillatorType;
  noteHz: number;
  durationMs: number;
  gain: number;
  routeKey: string;
  isAnomalyDriven: boolean;
}

interface LiveMutationExplainabilityOptions {
  limit?: number;
  replayWindowIndex?: number | null;
  trackId?: string | null;
  trackTitle?: string | null;
  trackSecond?: number | null;
}

function markerKey(marker: Pick<LiveLogMarker, "eventIndex" | "component">): string {
  return `${marker.eventIndex}:${marker.component}`;
}

function normalizeLevel(level: string): string {
  return level.trim().toUpperCase() || "INFO";
}

function triggerLabelForCue(
  cue: Pick<ExplainableLiveCue, "level" | "accent">,
  marker?: LiveLogMarker,
): string {
  if (marker || cue.accent === "anomaly") {
    return "Anomaly spike";
  }

  const level = normalizeLevel(cue.level);
  if (level === "ERROR") {
    return "Error burst";
  }
  if (level === "WARN" || level === "WARNING") {
    return "Warning pressure";
  }

  return "Info cadence";
}

function triggerDetailForCue(
  cue: Pick<ExplainableLiveCue, "component" | "excerpt">,
  marker?: LiveLogMarker,
): string {
  return marker?.excerpt || cue.excerpt || cue.component;
}

function resultLabelForCue(
  cue: Pick<ExplainableLiveCue, "routeLabel" | "stemLabel">,
): string {
  const routeLabel = cue.routeLabel.trim() || "Routed layer";
  const stemLabel = cue.stemLabel.trim();
  return stemLabel ? `${routeLabel} → ${stemLabel}` : routeLabel;
}

function resultDetailForCue(
  cue: Pick<ExplainableLiveCue, "sectionLabel" | "focus">,
): string {
  const sectionLabel = cue.sectionLabel.trim();
  const focus = cue.focus.trim();

  if (sectionLabel && focus) {
    return `${sectionLabel} · ${focus}`;
  }
  if (sectionLabel) {
    return sectionLabel;
  }
  if (focus) {
    return focus;
  }

  return "Internal live mutation";
}

export function deriveLiveMutationExplanations(
  cues: readonly ExplainableLiveCue[],
  markers: readonly LiveLogMarker[],
  options: number | LiveMutationExplainabilityOptions = 6,
): LiveMutationExplanation[] {
  const resolvedOptions =
    typeof options === "number" ? { limit: options } : options;
  const markersByEvent = new Map<string, LiveLogMarker>();
  const firstMarkerByIndex = new Map<number, LiveLogMarker>();

  for (const marker of markers) {
    const key = markerKey(marker);
    if (!markersByEvent.has(key)) {
      markersByEvent.set(key, marker);
    }
    if (!firstMarkerByIndex.has(marker.eventIndex)) {
      firstMarkerByIndex.set(marker.eventIndex, marker);
    }
  }

  return cues.slice(0, Math.max(0, resolvedOptions.limit ?? 6)).map((cue) => {
    const marker =
      markersByEvent.get(markerKey(cue)) ?? firstMarkerByIndex.get(cue.eventIndex);
    const isAnomalyDriven = Boolean(marker) || cue.accent === "anomaly";

    return {
      id: `${cue.id}:${cue.eventIndex}:${cue.component}`,
      eventIndex: cue.eventIndex,
      replayWindowIndex: resolvedOptions.replayWindowIndex ?? null,
      component: cue.component,
      level: normalizeLevel(cue.level),
      trackId: resolvedOptions.trackId ?? null,
      trackTitle: resolvedOptions.trackTitle ?? null,
      trackSecond:
        typeof resolvedOptions.trackSecond === "number"
          ? resolvedOptions.trackSecond
          : null,
      sourceExcerpt: triggerDetailForCue(cue, marker),
      triggerLabel: triggerLabelForCue(cue, marker),
      triggerDetail: triggerDetailForCue(cue, marker),
      resultLabel: resultLabelForCue(cue),
      resultDetail: resultDetailForCue(cue),
      focus: cue.focus,
      waveform: cue.waveform,
      noteHz: cue.noteHz,
      durationMs: cue.durationMs,
      gain: cue.gain,
      routeKey: cue.routeKey,
      isAnomalyDriven,
    };
  });
}

export function toLiveMutationVisualizationCues(
  explanations: readonly LiveMutationExplanation[],
): VisualizationCuePoint[] {
  return explanations
    .filter(
      (explanation): explanation is LiveMutationExplanation & { trackSecond: number } =>
        typeof explanation.trackSecond === "number" &&
        Number.isFinite(explanation.trackSecond),
    )
    .map((explanation) => ({
      second: explanation.trackSecond,
      label: `E${explanation.eventIndex}`,
      type: explanation.isAnomalyDriven ? "anomaly" : explanation.routeKey,
      excerpt: `${explanation.component} · ${explanation.triggerLabel} → ${explanation.resultLabel}`,
    }))
    .sort((left, right) => left.second - right.second);
}
