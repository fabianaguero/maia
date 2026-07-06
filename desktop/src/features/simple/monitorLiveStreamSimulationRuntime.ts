import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
} from "./monitorLiveStreamControllerTypes";
import { buildSimulatedMonitorState } from "./monitorLiveStreamOrchestrationRuntime";

export function simulateMonitorLiveStreamLogState(input: {
  nowMs: number;
  previousLiveLines: MonitorLiveStreamControllerRefs["liveLinesRef"]["current"];
  previousLogSignalBuffer: MonitorLiveStreamControllerRefs["logSignalBufferRef"]["current"];
  setLiveLines: MonitorLiveStreamControllerSetters["setLiveLines"];
  setLogSignalBuffer: (
    value: MonitorLiveStreamControllerRefs["logSignalBufferRef"]["current"],
  ) => void;
  refs: Pick<MonitorLiveStreamControllerRefs, "liveLinesRef" | "logSignalBufferRef">;
  randomValue?: number;
  maxLiveLines?: number;
}) {
  const nextState = buildSimulatedMonitorState({
    nowMs: input.nowMs,
    previousLiveLines: input.previousLiveLines,
    previousLogSignalBuffer: input.previousLogSignalBuffer,
    randomValue: input.randomValue,
    maxLiveLines: input.maxLiveLines,
  });

  input.refs.liveLinesRef.current = nextState.nextLiveLines;
  input.refs.logSignalBufferRef.current = nextState.nextLogSignalBuffer;
  input.setLiveLines(nextState.nextLiveLines);
  input.setLogSignalBuffer(nextState.nextLogSignalBuffer);

  return nextState;
}
