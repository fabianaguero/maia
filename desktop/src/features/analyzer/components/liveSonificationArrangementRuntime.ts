import type { MutationProfileOption } from "../../../types/music";
import type {
  ArrangementTrack,
  ArrangementVoice,
  RoutedLiveCue,
} from "./liveSonificationSceneTypes";

interface VoiceDef {
  track: ArrangementTrack;
  panOffset: number;
  noteMultiplier: number;
  gainMultiplier: number;
  timeOffsetMs: number;
}

const ARRANGEMENT_VOICE_MAP: Record<string, VoiceDef[]> = {
  info: [
    {
      track: "foundation",
      panOffset: 0,
      noteMultiplier: 1.0,
      gainMultiplier: 1.0,
      timeOffsetMs: 0,
    },
  ],
  warn: [
    {
      track: "foundation",
      panOffset: -0.18,
      noteMultiplier: 1.0,
      gainMultiplier: 0.9,
      timeOffsetMs: 0,
    },
    {
      track: "motion",
      panOffset: 0.22,
      noteMultiplier: 1.498,
      gainMultiplier: 0.52,
      timeOffsetMs: 14,
    },
  ],
  error: [
    {
      track: "foundation",
      panOffset: -0.24,
      noteMultiplier: 1.0,
      gainMultiplier: 0.88,
      timeOffsetMs: 0,
    },
    { track: "motion", panOffset: 0, noteMultiplier: 1.498, gainMultiplier: 0.6, timeOffsetMs: 10 },
    {
      track: "accent",
      panOffset: 0.26,
      noteMultiplier: 2.0,
      gainMultiplier: 0.4,
      timeOffsetMs: 20,
    },
  ],
  anomaly: [
    {
      track: "motion",
      panOffset: -0.28,
      noteMultiplier: 1.498,
      gainMultiplier: 0.78,
      timeOffsetMs: 0,
    },
    {
      track: "accent",
      panOffset: 0.24,
      noteMultiplier: 2.0,
      gainMultiplier: 0.82,
      timeOffsetMs: 8,
    },
    {
      track: "accent",
      panOffset: 0.12,
      noteMultiplier: 2.245,
      gainMultiplier: 0.36,
      timeOffsetMs: 24,
    },
  ],
};

export function resolveArrangementVoices(
  cues: readonly RoutedLiveCue[],
  arrangementDepth: MutationProfileOption["arrangementDepth"] = "full",
): ArrangementVoice[] {
  const voices: ArrangementVoice[] = [];

  for (const cue of cues) {
    const defs: VoiceDef[] =
      ARRANGEMENT_VOICE_MAP[cue.routeKey] ?? ARRANGEMENT_VOICE_MAP.info ?? [];
    const limitedDefs =
      arrangementDepth === "minimal"
        ? (() => {
            const foundationDefs = defs.filter((def) => def.track === "foundation");
            return foundationDefs.length > 0 ? foundationDefs.slice(0, 1) : defs.slice(0, 1);
          })()
        : arrangementDepth === "stacked"
          ? [
              ...defs,
              {
                track: cue.routeKey === "info" ? "motion" : "accent",
                panOffset: cue.routeKey === "info" ? 0.16 : -0.16,
                noteMultiplier: cue.routeKey === "info" ? 1.245 : 2.51,
                gainMultiplier: cue.routeKey === "info" ? 0.28 : 0.22,
                timeOffsetMs: cue.routeKey === "info" ? 16 : 28,
              } satisfies VoiceDef,
            ]
          : defs;

    for (const def of limitedDefs) {
      voices.push({ cue, ...def });
    }
  }

  return voices;
}
