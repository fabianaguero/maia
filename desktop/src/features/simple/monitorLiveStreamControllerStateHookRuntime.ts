import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
} from "./monitorLiveStreamControllerRuntime";
import { simulateMonitorLiveStreamLogState } from "./monitorLiveStreamControllerRuntime";

export function createMonitorLiveStreamSimulateLogHandler(input: {
  refs: Pick<MonitorLiveStreamControllerRefs, "liveLinesRef" | "logSignalBufferRef">;
  setLiveLines: MonitorLiveStreamControllerSetters["setLiveLines"];
  setLogSignalBuffer: (
    value: MonitorLiveStreamControllerRefs["logSignalBufferRef"]["current"],
  ) => void;
  maxLiveLines: number;
  now: () => number;
  random: () => number;
}) {
  return () =>
    simulateMonitorLiveStreamLogState({
      nowMs: input.now(),
      previousLiveLines: input.refs.liveLinesRef.current,
      previousLogSignalBuffer: input.refs.logSignalBufferRef.current,
      setLiveLines: input.setLiveLines,
      setLogSignalBuffer: input.setLogSignalBuffer,
      refs: input.refs,
      randomValue: input.random(),
      maxLiveLines: input.maxLiveLines,
    });
}
