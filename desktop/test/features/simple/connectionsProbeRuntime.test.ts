import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import type { StreamSessionPollResult } from "../../../src/types/monitor";
import {
  evaluateConnectionProbeStep,
  resolveConnectionProbeSuccessMessage,
  runConnectionProbeLoop,
} from "../../../src/features/simple/connectionsProbeRuntime";

function createPollResult(
  overrides: Partial<StreamSessionPollResult> = {},
): StreamSessionPollResult {
  return {
    session: {
      sessionId: "session-1",
      adapterKind: "file",
      source: "/var/log/app.log",
      label: "app",
      createdAt: "2026-06-25T18:00:00.000Z",
      lastPolledAt: "2026-06-25T18:00:01.000Z",
      totalPolls: 1,
      fileCursor: 64,
    },
    hasData: false,
    summary: "Idle",
    suggestedBpm: null,
    confidence: 0.5,
    dominantLevel: "info",
    lineCount: 0,
    anomalyCount: 0,
    levelCounts: {},
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: [],
    warnings: [],
    ...overrides,
  };
}

describe("connectionsProbeRuntime", () => {
  it("resolves file and cloud probe steps", () => {
    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "file_log",
        result: createPollResult({
          hasData: true,
          lineCount: 12,
          parsedLines: ["INFO boot complete"],
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      sawData: true,
      errorMessage: null,
      summary: "12 lines available from the tail",
      done: true,
    });

    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "gcp_cloud_run",
        result: createPollResult({
          warnings: ["ERROR: Permission denied while opening Cloud Logging"],
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      errorMessage: "ERROR: Permission denied while opening Cloud Logging",
      done: true,
    });
  });

  it("keeps waiting when a cloud connection has no ready marker or observable data", () => {
    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "gcp_cloud_run",
        result: createPollResult({
          summary: "",
          parsedLines: ["DEBUG polling adapter"],
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      sawData: true,
      sawReady: false,
      errorMessage: null,
      summary: en.simpleMode.connections.connectionOpened,
      done: false,
    });
  });

  it("falls back to waiting summaries for idle file/cloud probes", () => {
    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "file_log",
        result: createPollResult({
          summary: "",
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      summary: en.simpleMode.connections.fileTailOpenedWaiting,
      done: true,
    });

    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "gcp_cloud_run",
        result: createPollResult({
          hasData: false,
          summary: "",
          parsedLines: ["Initializing tail session."],
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      sawReady: true,
      summary: en.simpleMode.connections.connectionOpened,
      done: true,
    });

    expect(
      resolveConnectionProbeSuccessMessage({
        t: en,
        connectionKind: "file_log",
        latestSummary: "",
        sawData: false,
        sawReady: false,
      }),
    ).toBe(en.simpleMode.connections.fileTailOpenedCorrectly);

    expect(
      resolveConnectionProbeSuccessMessage({
        t: en,
        connectionKind: "gcp_cloud_run",
        latestSummary: "",
        sawData: true,
        sawReady: false,
      }),
    ).toBe(en.simpleMode.connections.cloudTailOpenedCorrectly);
  });

  it("resolves success messages and probe loops", async () => {
    expect(
      resolveConnectionProbeSuccessMessage({
        t: en,
        connectionKind: "gcp_cloud_run",
        latestSummary: "",
        sawData: false,
        sawReady: false,
      }),
    ).toBe(en.simpleMode.connections.connectionOpenedWaitingLogs);

    await expect(
      runConnectionProbeLoop({
        t: en,
        connectionKind: "file_log",
        sessionId: "test-conn-1",
        pollStreamSession: async () =>
          createPollResult({
            hasData: true,
            lineCount: 7,
            parsedLines: ["INFO boot complete"],
          }),
        sleep: async () => undefined,
      }),
    ).resolves.toEqual({
      status: "success",
      message: "7 lines available from the tail",
    });
  });

  it("returns cloud probe errors and waiting success after exhausting retries", async () => {
    await expect(
      runConnectionProbeLoop({
        t: en,
        connectionKind: "gcp_cloud_run",
        sessionId: "test-cloud-1",
        pollStreamSession: async () =>
          createPollResult({
            warnings: ["Permission denied"],
            parsedLines: ["ERROR: Permission denied"],
          }),
        sleep: async () => undefined,
      }),
    ).resolves.toEqual({
      status: "error",
      message: "Permission denied",
    });

    const pollStreamSession = async () =>
      createPollResult({
        summary: "",
        parsedLines: ["DEBUG adapter idle"],
      });

    await expect(
      runConnectionProbeLoop({
        t: en,
        connectionKind: "gcp_cloud_run",
        sessionId: "test-cloud-2",
        pollStreamSession,
        sleep: async () => undefined,
        attemptCount: 2,
        initialSummary: "",
      }),
    ).resolves.toEqual({
      status: "success",
      message: en.simpleMode.connections.cloudTailOpenedCorrectly,
    });
  });
});
