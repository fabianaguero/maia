import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { StreamListener } from "./monitorContextTypes";
import type { MonitorListenerRuntimeLogger } from "./monitorUpdateTypes";

export function dispatchMonitorStreamListeners(
  listeners: Iterable<StreamListener>,
  update: LiveLogStreamUpdate,
): number {
  let dispatched = 0;
  for (const listener of listeners) {
    listener(update);
    dispatched += 1;
  }
  return dispatched;
}

export function subscribeToMonitorStreamState(input: {
  listeners: Set<StreamListener>;
  listener: StreamListener;
  logger?: MonitorListenerRuntimeLogger;
}): () => void {
  input.listeners.add(input.listener);
  input.logger?.info("subscribe → listeners=%d", input.listeners.size);

  return () => {
    input.listeners.delete(input.listener);
    input.logger?.info("unsubscribe → listeners=%d", input.listeners.size);
  };
}
