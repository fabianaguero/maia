import { POLL_INTERVAL_MS, type MonitorPollingRefs } from "./monitorSessionPollingTypes";

export function stopMonitorPollingState(
  input: MonitorPollingRefs & {
    clearTimeoutFn: (timer: number) => void;
  },
): void {
  input.activeRef.current = false;
  if (input.pollTimerRef.current !== null) {
    input.clearTimeoutFn(input.pollTimerRef.current);
    input.pollTimerRef.current = null;
  }

  if (input.wsRef.current) {
    input.wsRef.current.onmessage = null;
    input.wsRef.current.onerror = null;
    input.wsRef.current.onclose = null;
    try {
      input.wsRef.current.close();
    } catch {
      // ignore cleanup failures
    }
    input.wsRef.current = null;
  }

  input.wsLineBufferRef.current = [];
  input.httpUrlRef.current = "";
}

export function scheduleMonitorPoll(input: {
  activeRef: MonitorPollingRefs["activeRef"];
  pollTimerRef: MonitorPollingRefs["pollTimerRef"];
  intervalMs?: number;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  doPoll: () => Promise<void>;
}): void {
  if (!input.activeRef.current) {
    return;
  }

  input.pollTimerRef.current = input.setTimeoutFn(() => {
    void input.doPoll();
  }, input.intervalMs ?? POLL_INTERVAL_MS);
}
