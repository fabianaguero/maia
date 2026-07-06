import type { LiveLogCue } from "../../types/monitor";

export type MonitorCueBatchEntry = Pick<
  LiveLogCue,
  "noteHz" | "gain" | "durationMs" | "waveform" | "accent"
>;

export type MonitorCueBatch = MonitorCueBatchEntry[];

export type MonitorCueBatchPlayer = (cues: MonitorCueBatch) => void;
