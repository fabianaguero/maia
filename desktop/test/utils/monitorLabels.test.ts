import { describe, expect, it, vi } from "vitest";
import { en } from "../../src/i18n/en";
import {
  formatBpmLabel,
  formatDominantLevelLabel,
  formatMonitorShortUptime,
  getStreamAdapterCode,
  getMonitorAnomaliesInlineLabel,
  getMonitorLiveStatusLabel,
  resolveSessionStatusLabel,
} from "../../src/utils/monitorLabels";

describe("monitorLabels", () => {
  it("maps known session statuses to translated labels", () => {
    expect(resolveSessionStatusLabel("active", en)).toBe(en.session.active);
    expect(resolveSessionStatusLabel("paused", en)).toBe(en.session.paused);
    expect(resolveSessionStatusLabel("stopped", en)).toBe(en.session.stopped);
  });

  it("falls back to raw status for unknown values", () => {
    expect(resolveSessionStatusLabel("queued", en)).toBe("queued");
  });

  it("formats adapter codes deterministically", () => {
    expect(getStreamAdapterCode("file")).toBe("FILE_TAIL");
    expect(getStreamAdapterCode("process")).toBe("PROCESS_TAIL");
    expect(getStreamAdapterCode("http-poll")).toBe("HTTP_POLL");
    expect(getStreamAdapterCode("websocket")).toBe("WEBSOCKET_STREAM");
    expect(getStreamAdapterCode("journald")).toBe("JOURNALD_STREAM");
    expect(getStreamAdapterCode(undefined)).toBe("FILE_TAIL");
  });

  it("formats BPM labels and custom empty state", () => {
    expect(formatBpmLabel(126.4)).toBe("126 BPM");
    expect(formatBpmLabel(null)).toBe("— BPM");
    expect(formatBpmLabel(undefined, "Pending BPM")).toBe("Pending BPM");
  });

  it("humanizes dominant level labels", () => {
    expect(formatDominantLevelLabel("error_spike")).toBe("Error Spike");
    expect(formatDominantLevelLabel(" WARN-BURST ")).toBe("Warn Burst");
    expect(formatDominantLevelLabel("-")).toBe("—");
    expect(formatDominantLevelLabel("")).toBe("—");
    expect(formatDominantLevelLabel("   ", "Idle")).toBe("Idle");
  });

  it("formats short monitor uptime defensively", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(120_000);
    expect(formatMonitorShortUptime(118_000)).toBe("2s");
    expect(formatMonitorShortUptime(10_000)).toBe("1m 50s");
    expect(formatMonitorShortUptime(null)).toBe("00:00");
    expect(formatMonitorShortUptime(0)).toBe("00:00");
    expect(formatMonitorShortUptime(Number.NaN)).toBe("00:00");
    nowSpy.mockRestore();
  });

  it("exposes shared monitor status labels", () => {
    expect(getMonitorLiveStatusLabel(en)).toBe(en.simpleMode.monitor.systemActive);
    expect(getMonitorAnomaliesInlineLabel(en)).toBe("anomalies");
  });
});
