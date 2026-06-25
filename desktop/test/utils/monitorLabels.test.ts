import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import {
  formatBpmLabel,
  formatDominantLevelLabel,
  getStreamAdapterCode,
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
    expect(formatDominantLevelLabel("")).toBe("—");
    expect(formatDominantLevelLabel("   ", "Idle")).toBe("Idle");
  });
});
