import { describe, expect, it, vi } from "vitest";

import { buildAppMonitorSessionActionRunners } from "../../src/hooks/appMonitorSessionActionRunnerRuntime";

const sessionRuntimeMock = vi.hoisted(() => ({
  startReplayMonitorSession: vi.fn(async () => true),
  startLiveMonitorSession: vi.fn(async () => true),
  openCurrentMonitoredRepo: vi.fn(),
}));

vi.mock("../../src/hooks/appMonitorSessionActionsRuntime", () => sessionRuntimeMock);

describe("appMonitorSessionActionRunnerRuntime", () => {
  it("builds session action runners around focused runtime inputs", async () => {
    const replayInput = { kind: "replay" } as never;
    const liveInput = { kind: "live" } as never;
    const openRepoInput = { kind: "open" } as never;

    const runners = buildAppMonitorSessionActionRunners({
      replayInput,
      liveInput,
      openRepoInput,
    });

    await expect(runners.startReplaySession({ id: "session-1" } as never, 3)).resolves.toBe(true);
    await expect(
      runners.startLiveSession(
        { adapterKind: "file", sessionId: "runtime-1" } as never,
        "persisted-1",
        { sourceId: "repo-1" },
      ),
    ).resolves.toBe(true);
    runners.openMonitoredRepo();

    expect(sessionRuntimeMock.startReplayMonitorSession).toHaveBeenCalledWith(
      replayInput,
      { id: "session-1" },
      3,
    );
    expect(sessionRuntimeMock.startLiveMonitorSession).toHaveBeenCalledWith(
      liveInput,
      { adapterKind: "file", sessionId: "runtime-1" },
      "persisted-1",
      { sourceId: "repo-1" },
    );
    expect(sessionRuntimeMock.openCurrentMonitoredRepo).toHaveBeenCalledWith(openRepoInput);
  });
});
