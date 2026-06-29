import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type {
  MonitorContextValue,
} from "./monitorContextTypes";
import { useMonitorProviderController } from "./useMonitorProviderController";

// ---------------------------------------------------------------------------
// Context plumbing
// ---------------------------------------------------------------------------

const MonitorCtx = createContext<MonitorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MonitorProvider({ children }: { children: ReactNode }) {
  const value = useMonitorProviderController();

  return <MonitorCtx.Provider value={value}>{children}</MonitorCtx.Provider>;
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useMonitor(): MonitorContextValue {
  const ctx = useContext(MonitorCtx);
  if (!ctx) {
    throw new Error("useMonitor must be called inside <MonitorProvider>");
  }
  return ctx;
}

export type {
  ActiveMonitorSession,
  MonitorContextValue,
  MonitorMetrics,
} from "./monitorContextTypes";
