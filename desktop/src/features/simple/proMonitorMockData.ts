import type { AppTranslations } from "../../i18n/types";

export interface ProMonitorLogLine {
  timestamp: string;
  level: "info" | "warn" | "error";
  service: string;
  message: string;
}

export interface ProMonitorBookmark {
  id: string;
  timestamp: string;
  tagKind: "spike" | "anomaly" | "recovery" | "custom";
}

export interface ProMonitorMockData {
  sessionTitle: string;
  sessionElapsed: string;
  trackTitle: string;
  bpm: string;
  alertTimestamp: string;
  metrics: {
    anomalies: string;
    confidence: string;
    polls: string;
    linesRead: string;
  };
  logLines: ProMonitorLogLine[];
  bookmarks: ProMonitorBookmark[];
}

export function buildProMonitorMockData(t: AppTranslations): ProMonitorMockData {
  const sessionTitle = t.simpleMode.proMonitor.demoSessionTitle;
  const trackTitle = t.simpleMode.proMonitor.demoTrackTitle;

  return {
    sessionTitle,
    sessionElapsed: "12m 34s",
    trackTitle,
    bpm: "126",
    alertTimestamp: "09:14:52",
    metrics: {
      anomalies: "4",
      confidence: "87%",
      polls: "238",
      linesRead: "1,847",
    },
    logLines: [
      {
        timestamp: "09:14:22",
        level: "info",
        service: sessionTitle,
        message: t.simpleMode.proMonitor.healthCheckOk,
      },
      {
        timestamp: "09:14:27",
        level: "warn",
        service: sessionTitle,
        message: t.simpleMode.proMonitor.retrySpikeDetected,
      },
      {
        timestamp: "09:14:29",
        level: "error",
        service: sessionTitle,
        message: t.simpleMode.proMonitor.timeoutCallingGateway,
      },
      {
        timestamp: "09:14:35",
        level: "info",
        service: sessionTitle,
        message: t.simpleMode.proMonitor.fallbackRouteEngaged,
      },
      {
        timestamp: "09:14:41",
        level: "info",
        service: sessionTitle,
        message: t.simpleMode.proMonitor.recoveryConfirmed,
      },
      {
        timestamp: "09:14:52",
        level: "warn",
        service: sessionTitle,
        message: t.simpleMode.proMonitor.providerLatencyHigh,
      },
    ],
    bookmarks: [
      { id: "1", timestamp: "09:14:27", tagKind: "spike" },
      { id: "2", timestamp: "09:14:29", tagKind: "anomaly" },
      { id: "3", timestamp: "09:14:35", tagKind: "recovery" },
    ],
  };
}
