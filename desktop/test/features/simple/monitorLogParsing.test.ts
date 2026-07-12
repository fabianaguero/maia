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

  it("falls back safely when the cloud timestamp is empty or unparseable", () => {
    const blankTimestamp = formatCloudTimestamp("   ");
    const customTimestamp = formatCloudTimestamp("2026-06-24T21:55:46.323583-custom");

    expect(blankTimestamp.length).toBeGreaterThan(0);
    expect(customTimestamp).toContain("2026-06-24 21:55:46");
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

  it("falls back to the raw cloud severity-first line when the parsed message is empty", () => {
    const line = parseMonitorLogLine("ERROR 2026-06-24T21:55:46.323583Z ", 4);

    expect(line.level).toBe("error");
    expect(line.message).toBe("ERROR 2026-06-24T21:55:46.323583Z");
    expect(line.isAnomaly).toBe(true);
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

  it("defaults tabbed cloud lines without severity to info and raw fallback text", () => {
    const line = parseMonitorLogLine("2026-06-24T21:55:46.323583Z\t\t", 6);

    expect(line.level).toBe("info");
    expect(line.message).toBe("2026-06-24T21:55:46.323583Z");
    expect(line.isAnomaly).toBe(false);
    expect(line.anomalyId).toBeNull();
  });

  it("maps fatal severities and anomaly keywords from cloud-first logs", () => {
    const line = parseMonitorLogLine(
      "FATAL 2026-06-24T21:55:46.323583Z panic while reading upstream state",
      5,
    );

    expect(line.level).toBe("error");
    expect(line.isAnomaly).toBe(true);
    expect(line.anomalyId).not.toBeNull();
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

  it("falls back to classic parsing for plain lines without brackets", () => {
    const line = parseMonitorLogLine("NOTICE process boot completed", 7);

    expect(line.level).toBe("info");
    expect(line.message).toBe("NOTICE process boot completed");
    expect(line.id).toContain("-7-");
  });

  it("marks anomaly keywords in classic fallback lines without brackets", () => {
    const line = parseMonitorLogLine("worker failed to flush timeout buffer", 8);

    expect(line.level).toBe("info");
    expect(line.isAnomaly).toBe(true);
    expect(line.anomalyId).not.toBeNull();
  });

  it("keeps anomaly regex narrow enough for non-error operational text", () => {
    expect(isMonitorAnomaly("info", "Process result for reservation DEMO-34853: skipped")).toBe(
      false,
    );
    expect(isMonitorAnomaly("info", "timeout while reading upstream response")).toBe(true);
  });

  it("parses SonarQube issues with line numbers and extracts metadata", () => {
    // Rust maps MAJOR severity to ERROR log_level
    const line = parseMonitorLogLine(
      "[2026-07-12T03:00:00Z] [SONARQUBE-ERROR] typescript:S1234 Unexpected complexity (src/app.ts:42)",
      0,
    );

    expect(line.timestamp).toBe("2026-07-12T03:00:00Z");
    expect(line.level).toBe("warn"); // ERROR log_level from MAJOR → warn in TS
    expect(line.message).toBe("Unexpected complexity");
    expect(line.sonarQubeMeta).toBeDefined();
    expect(line.sonarQubeMeta?.rule).toBe("typescript:S1234");
    expect(line.sonarQubeMeta?.component).toBe("src/app.ts");
    expect(line.sonarQubeMeta?.line).toBe(42);
    expect(line.sonarQubeMeta?.sonarSeverity).toBe("ERROR");
    expect(line.isAnomaly).toBe(true);
  });

  it("parses SonarQube issues without line numbers", () => {
    // Rust maps MINOR severity to WARN log_level
    const line = parseMonitorLogLine(
      "[2026-07-12T03:00:00Z] [SONARQUBE-WARN] java:S0123 Potential null pointer (Auth.java)",
      1,
    );

    expect(line.level).toBe("warn"); // WARN log_level from MINOR → warn in TS
    expect(line.message).toBe("Potential null pointer");
    expect(line.sonarQubeMeta?.rule).toBe("java:S0123");
    expect(line.sonarQubeMeta?.component).toBe("Auth.java");
    expect(line.sonarQubeMeta?.line).toBeUndefined();
    expect(line.sonarQubeMeta?.sonarSeverity).toBe("WARN");
  });

  it("maps SonarQube BLOCKER/CRITICAL to error level", () => {
    // Rust maps BLOCKER/CRITICAL severity to CRITICAL log_level
    const blocker = parseMonitorLogLine(
      "[2026-07-12T03:00:00Z] [SONARQUBE-CRITICAL] typescript:S9999 Security issue (index.ts:10)",
      0,
    );

    expect(blocker.level).toBe("error"); // CRITICAL log_level → error in TS
    expect(blocker.isAnomaly).toBe(true);
  });

  it("maps SonarQube INFO severity to info level", () => {
    // Rust keeps INFO severity as INFO log_level
    const info = parseMonitorLogLine(
      "[2026-07-12T03:00:00Z] [SONARQUBE-INFO] python:S0001 Info message (utils.py:25)",
      1,
    );

    expect(info.level).toBe("info"); // INFO log_level → info in TS
    expect(info.isAnomaly).toBe(false);
  });
});
