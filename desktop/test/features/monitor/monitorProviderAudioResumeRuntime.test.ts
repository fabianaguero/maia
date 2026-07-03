import { describe, expect, it, vi } from "vitest";

import { buildResumeMonitorAudioContextStateInput } from "../../../src/features/monitor/monitorProviderAudioResumeRuntime";

describe("monitorProviderAudioResumeRuntime", () => {
  it("builds manual resume state with the expected probe and resume reason", () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const state = buildResumeMonitorAudioContextStateInput({
      audioContextRef: { current: null },
      setAudioContext: vi.fn(),
      logger,
    });

    const ensureState = state.ensureAudioContext();
    const probeState = state.emitProbe({ state: "running" } as AudioContext);

    expect(ensureState.reason).toBe("manual-resume");
    expect(ensureState.logger).toBe(logger);
    expect(probeState.frequency).toBe(440);
    expect(probeState.releaseTimeSec).toBe(0.3);
  });
});
