import { describe, expect, it } from "vitest";

import {
  createLiveMonitorSessionId,
  resolveBeatLooperStartBpm,
  resolveLiveMonitorStartFailureMessage,
  resolveLiveMonitorStartWarning,
} from "../../../../src/features/analyzer/components/liveLogMonitorControlRuntime";

describe("liveLogMonitorControlRuntime", () => {
  it("builds stable session ids and tmp-path warnings", () => {
    expect(createLiveMonitorSessionId("repo-1", 1234)).toBe("sess-repo-1-1234");
    expect(resolveLiveMonitorStartWarning("file", "/tmp/test.log")).toContain("/tmp/");
    expect(resolveLiveMonitorStartWarning("file", "/var/log/app.log")).toBeNull();
  });

  it("formats start failures and beat looper bpm defaults", () => {
    expect(resolveLiveMonitorStartFailureMessage(new Error("boom"), String)).toContain("boom");
    expect(resolveBeatLooperStartBpm(126)).toBe(126);
    expect(resolveBeatLooperStartBpm(null)).toBe(120);
  });
});
