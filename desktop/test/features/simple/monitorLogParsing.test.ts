import { describe, expect, it } from "vitest";

import {
  formatCloudTimestamp,
  isMonitorAnomaly,
  normalizeMonitorLevel,
  parseMonitorLogLine,
} from "../../../src/features/simple/monitorLogParsing";

describe("monitorLogParsing", () => {
  it("normalizes cloud severities conservatively", () => {
    expect(normalizeMonitorLevel("NOTICE")).toBe("info");
    expect(normalizeMonitorLevel("WARNING")).toBe("warn");
    expect(normalizeMonitorLevel("CRITICAL")).toBe("error");
    expect(normalizeMonitorLevel("DEFAULT")).toBe("info");
  });

  it("formats gcloud timestamps without raw ISO noise", () => {
    const formatted = formatCloudTimestamp("2026-06-24T21:55:46.323583Z");
    expect(formatted).toContain("2026-06-24");
    expect(formatted).not.toContain("T");
    expect(formatted).not.toContain(".323583");
  });

  it("does not mark clean cloud info lines as anomalies", () => {
    const line = parseMonitorLogLine(
      'DEFAULT 2026-06-24T21:55:46.323583Z HTTP Request: GET https://example.com "HTTP/1.1 200 OK"',
      0,
    );

    expect(line.level).toBe("info");
    expect(line.isAnomaly).toBe(false);
    expect(line.anomalyId).toBeNull();
    expect(line.message).toContain("HTTP Request");
  });

  it("marks cloud error lines as anomalies", () => {
    const line = parseMonitorLogLine(
      'ERROR 2026-06-24T21:55:46.323583Z PUT /webhooks/log "HTTP/1.1 500 Internal Server Error"',
      3,
    );

    expect(line.level).toBe("error");
    expect(line.isAnomaly).toBe(true);
    expect(line.message).toContain("500 Internal Server Error");
    expect(line.anomalyId).not.toBeNull();
  });

  it("parses tabbed gcloud output", () => {
    const line = parseMonitorLogLine(
      "2026-06-24T21:55:46.323583Z\tWARNING\tTimeout while reading upstream response",
      1,
    );

    expect(line.level).toBe("warn");
    expect(line.isAnomaly).toBe(true);
    expect(line.message).toBe("Timeout while reading upstream response");
  });

  it("parses classic bracket logs", () => {
    const line = parseMonitorLogLine(
      "[06:29:47] [INFO] MAIA_MONITOR_INITIALIZED: PROCESS_TAIL armed.",
      2,
    );

    expect(line.timestamp).toBe("06:29:47");
    expect(line.level).toBe("info");
    expect(line.message).toContain("MAIA_MONITOR_INITIALIZED");
    expect(line.isAnomaly).toBe(false);
  });

  it("keeps anomaly regex narrow enough for non-error operational text", () => {
    expect(isMonitorAnomaly("info", "Process result for reservation CTO-34853: skipped")).toBe(
      false,
    );
    expect(isMonitorAnomaly("info", "timeout while reading upstream response")).toBe(true);
  });
});
