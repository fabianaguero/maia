import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import type { StreamSessionPollResult } from "../../../src/types/monitor";
import {
  buildConnectionTailControllerState,
  buildConnectionTailFailureApplyState,
  buildConnectionTailPollApplyState,
  resolveConnectionTailErrorMessage,
} from "../../../src/features/simple/connectionsTailControllerStateRuntime";

function createPollResult(
  overrides: Partial<StreamSessionPollResult> = {},
): StreamSessionPollResult {
  return {
    session: {
      sessionId: "session-1",
      adapterKind: "file",
      source: "/logs/visits-service.log",
      label: "visits-service",
      createdAt: "2026-06-26T10:00:00.000Z",
      lastPolledAt: "2026-06-26T10:00:01.000Z",
      totalPolls: 1,
      fileCursor: 10,
    },
    hasData: true,
    summary: "ready",
    suggestedBpm: null,
    confidence: 0.5,
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCounts: {},
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
    ...overrides,
  };
}

describe("connectionsTailControllerStateRuntime", () => {
  it("normalizes tail failures and poll application state", () => {
    expect(resolveConnectionTailErrorMessage(new Error("boom"))).toBe("boom");
    expect(resolveConnectionTailErrorMessage("plain")).toBe("plain");
    expect(buildConnectionTailFailureApplyState(new Error("boom"))).toEqual({
      activeSessionId: null,
      activeConnectionId: null,
      error: "boom",
    });
    expect(
      buildConnectionTailPollApplyState({
        t: en,
        currentPreview: ["INFO old line"],
        result: createPollResult(),
      }),
    ).toEqual({
      tailStatus: "2 lines · 1 anomalies · warn",
      tailPreview: ["INFO old line", "WARN queue depth rising"],
    });
  });

  it("returns a stable public tail controller contract", () => {
    const handleStartTail = vi.fn(async () => undefined);
    const handleStopTail = vi.fn(async () => undefined);
    expect(
      buildConnectionTailControllerState({
        activeSessionId: "session-1",
        activeConnectionId: "conn-1",
        tailPreview: ["line"],
        tailStatus: "ready",
        handleStartTail,
        handleStopTail,
      }),
    ).toEqual({
      activeSessionId: "session-1",
      activeConnectionId: "conn-1",
      tailPreview: ["line"],
      tailStatus: "ready",
      handleStartTail,
      handleStopTail,
    });
  });
});
