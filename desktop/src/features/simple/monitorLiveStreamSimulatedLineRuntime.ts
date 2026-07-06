import type { MonitorLogLine } from "./monitorLogParsing";

export function buildSimulatedMonitorLogLine(input: {
  nowMs: number;
  randomValue?: number;
  now?: Date;
}): MonitorLogLine {
  const levels: MonitorLogLine["level"][] = ["info", "warn", "error", "debug"];
  const messages = [
    "SYNTH_PULSE_DETECTED: Signal strength at 89%",
    "NODE_HANDSHAKE: Peer connection established",
    "ANOMALY_TRIGGER: Out-of-bounds telemetry detected",
    "BUFFER_FLUSH: Real-time stream synchronized",
    "MAIA_CORE: Sonification engine optimized",
  ];
  const sample = input.randomValue ?? Math.random();
  const levelIndex = Math.min(levels.length - 1, Math.floor(sample * levels.length));
  const messageIndex = Math.min(messages.length - 1, Math.floor(sample * messages.length));
  const level = levels[levelIndex]!;

  return {
    id: `sim-${input.nowMs}`,
    timestamp: (input.now ?? new Date(input.nowMs)).toLocaleTimeString().split(" ")[0],
    level,
    message: messages[messageIndex]!,
    isAnomaly: level === "error" || level === "warn",
    anomalyId: level === "error" || level === "warn" ? `sim-anomaly-${input.nowMs}` : null,
  };
}
