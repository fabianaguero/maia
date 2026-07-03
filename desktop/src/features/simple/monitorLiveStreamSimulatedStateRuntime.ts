import { buildSimulatedMonitorLogLine } from "./monitorLiveStreamSimulatedLineRuntime";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalRuntime";
import { advanceSimulatedLogSignalBuffer } from "./monitorLiveStreamSignalRuntime";

export function buildSimulatedMonitorState(input: {
  nowMs: number;
  previousLiveLines: MonitorLogLine[];
  previousLogSignalBuffer: MonitorLogSignalPoint[];
  randomValue?: number;
  maxLiveLines?: number;
}) {
  const mock = buildSimulatedMonitorLogLine({
    nowMs: input.nowMs,
    randomValue: input.randomValue,
  });

  return {
    mock,
    nextLiveLines: [mock, ...input.previousLiveLines].slice(0, input.maxLiveLines ?? 50),
    nextLogSignalBuffer: advanceSimulatedLogSignalBuffer(input.previousLogSignalBuffer, mock.level),
  };
}
