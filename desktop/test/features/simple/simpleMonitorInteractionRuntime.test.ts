import { describe, expect, it, vi } from "vitest";

import type { MonitorLogLine } from "../../../src/features/simple/monitorLogParsing";
import type { MonitorLaunchSource } from "../../../src/features/simple/monitorSourceOptions";
import {
  buildMonitorTailSyncPlan,
  canStartSimpleMonitorRequest,
  executeSimpleMonitorStartRequest,
  shouldPinMonitorTail,
} from "../../../src/features/simple/simpleMonitorInteractionRuntime";

const cloudSource: MonitorLaunchSource = {
  id: "connection:cloud-1",
  title: "services",
  sourcePath: "gcp-cloud-run://innate-portal/services",
  sourceType: "cloud",
  sourceTypeLabel: "Cloud",
  startable: true,
  origin: "connection",
  connectionId: "cloud-1",
};

const liveLines: MonitorLogLine[] = [
  {
    id: "line-1",
    timestamp: "06:10:00",
    level: "info",
    message: "boot complete",
    isAnomaly: false,
  },
  {
    id: "line-2",
    timestamp: "06:10:01",
    level: "warn",
    message: "queue depth rising",
    isAnomaly: true,
    anomalyId: "anomaly-1",
  },
];

describe("simpleMonitorInteractionRuntime", () => {
  it("recognizes when the live tail should stay pinned", () => {
    expect(shouldPinMonitorTail(4)).toBe(true);
    expect(shouldPinMonitorTail(8)).toBe(true);
    expect(shouldPinMonitorTail(14)).toBe(false);
  });

  it("builds a focus sync plan when the selected anomaly exists", () => {
    expect(
      buildMonitorTailSyncPlan({
        liveLines,
        selectedAnomalyId: "anomaly-1",
        shouldFocusSelectedLog: true,
        isTailPinned: true,
      }),
    ).toEqual({ type: "focus", lineId: "line-2" });
  });

  it("waits for the anomaly row instead of losing focus state", () => {
    expect(
      buildMonitorTailSyncPlan({
        liveLines,
        selectedAnomalyId: "missing-anomaly",
        shouldFocusSelectedLog: true,
        isTailPinned: true,
      }),
    ).toEqual({ type: "wait-focus" });
  });

  it("falls back to tail pinning when there is no anomaly focus request", () => {
    expect(
      buildMonitorTailSyncPlan({
        liveLines,
        selectedAnomalyId: null,
        shouldFocusSelectedLog: false,
        isTailPinned: true,
      }),
    ).toEqual({ type: "pin" });
  });

  it("returns none when there is no focus request and the tail is no longer pinned", () => {
    expect(
      buildMonitorTailSyncPlan({
        liveLines,
        selectedAnomalyId: null,
        shouldFocusSelectedLog: false,
        isTailPinned: false,
      }),
    ).toEqual({ type: "none" });
  });

  it("validates whether a simple monitor request can start", () => {
    expect(
      canStartSimpleMonitorRequest({
        selectedSourceOption: cloudSource,
        selectedSoundId: "track-1",
        canStartSelectedSource: true,
      }),
    ).toBe(true);
    expect(
      canStartSimpleMonitorRequest({
        selectedSourceOption: null,
        selectedSoundId: "track-1",
        canStartSelectedSource: true,
      }),
    ).toBe(false);
    expect(
      canStartSimpleMonitorRequest({
        selectedSourceOption: cloudSource,
        selectedSoundId: "",
        canStartSelectedSource: true,
      }),
    ).toBe(false);
  });

  it("runs the monitor start sequence in the expected order", async () => {
    const steps: string[] = [];
    const didStart = await executeSimpleMonitorStartRequest({
      selectedSourceOption: cloudSource,
      selectedSoundId: "track-1",
      canStartSelectedSource: true,
      setLaunchingImmediate: () => {
        steps.push("launching");
      },
      waitForNextFrame: async () => {
        steps.push("frame");
      },
      resumeAudio: async () => {
        steps.push("resume");
      },
      startMonitoring: async (_source, trackId) => {
        steps.push(`start:${trackId}`);
      },
      resetLaunchingOnFailure: () => {
        steps.push("reset");
      },
    });

    expect(didStart).toBe(true);
    expect(steps).toEqual(["launching", "frame", "resume", "start:track-1"]);
  });

  it("resets launching state if the monitor start fails", async () => {
    const setLaunchingImmediate = vi.fn();
    const resetLaunchingOnFailure = vi.fn();

    const didStart = await executeSimpleMonitorStartRequest({
      selectedSourceOption: cloudSource,
      selectedSoundId: "track-1",
      canStartSelectedSource: true,
      setLaunchingImmediate,
      waitForNextFrame: async () => undefined,
      resumeAudio: async () => undefined,
      startMonitoring: async () => {
        throw new Error("boom");
      },
      resetLaunchingOnFailure,
    });

    expect(didStart).toBe(false);
    expect(setLaunchingImmediate).toHaveBeenCalledTimes(1);
    expect(resetLaunchingOnFailure).toHaveBeenCalledTimes(1);
  });

  it("returns early without side effects when the start request is not valid", async () => {
    const setLaunchingImmediate = vi.fn();
    const waitForNextFrame = vi.fn(async () => undefined);
    const resumeAudio = vi.fn(async () => undefined);
    const startMonitoring = vi.fn(async () => undefined);
    const resetLaunchingOnFailure = vi.fn();

    const didStart = await executeSimpleMonitorStartRequest({
      selectedSourceOption: null,
      selectedSoundId: "track-1",
      canStartSelectedSource: true,
      setLaunchingImmediate,
      waitForNextFrame,
      resumeAudio,
      startMonitoring,
      resetLaunchingOnFailure,
    });

    expect(didStart).toBe(false);
    expect(setLaunchingImmediate).not.toHaveBeenCalled();
    expect(waitForNextFrame).not.toHaveBeenCalled();
    expect(resumeAudio).not.toHaveBeenCalled();
    expect(startMonitoring).not.toHaveBeenCalled();
    expect(resetLaunchingOnFailure).not.toHaveBeenCalled();
  });
});
