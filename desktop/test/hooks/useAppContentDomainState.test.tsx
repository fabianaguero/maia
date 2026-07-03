import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppContentDomainState } from "../../src/hooks/useAppContentDomainState";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";

const state = vi.hoisted(() => ({
  userMode: "basic",
  isTransitioning: false,
  manifest: { version: "1.0.0" },
  health: { status: "ok" },
  booting: false,
  shellState: { lang: "en" as "en" | "es" },
  library: { tracks: [] },
  repositories: { repositories: [] },
  baseAssets: { baseAssets: [] },
  compositions: { compositions: [] },
  monitor: { activeSessionId: null },
  sessions: { sessions: [] },
}));

vi.mock("../../src/features/simple/UserModeContext", () => ({
  useUserMode: () => ({ userMode: state.userMode }),
}));

vi.mock("../../src/features/simple/ModeTransition", () => ({
  useModeTransition: () => ({ isTransitioning: state.isTransitioning }),
}));

vi.mock("../../src/hooks/useAppContentBootstrap", () => ({
  useAppContentBootstrap: () => ({
    manifest: state.manifest,
    health: state.health,
    booting: state.booting,
  }),
}));

vi.mock("../../src/hooks/useAppContentShellState", () => ({
  useAppContentShellState: () => state.shellState,
}));

vi.mock("../../src/hooks/useLibrary", () => ({
  useLibrary: () => state.library,
}));

vi.mock("../../src/hooks/useRepositories", () => ({
  useRepositories: () => state.repositories,
}));

vi.mock("../../src/hooks/useBaseAssets", () => ({
  useBaseAssets: () => state.baseAssets,
}));

vi.mock("../../src/hooks/useCompositionResults", () => ({
  useCompositionResults: () => state.compositions,
}));

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => state.monitor,
}));

vi.mock("../../src/hooks/useSessions", () => ({
  useSessions: () => state.sessions,
}));

describe("useAppContentDomainState", () => {
  it("composes the domain state and resolves english copy by default", () => {
    state.shellState.lang = "en";

    const { result } = renderHook(() => useAppContentDomainState());

    expect(result.current.userMode).toBe("basic");
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.manifest).toBe(state.manifest);
    expect(result.current.health).toBe(state.health);
    expect(result.current.booting).toBe(false);
    expect(result.current.shellState).toBe(state.shellState);
    expect(result.current.t).toBe(en);
    expect(result.current.library).toBe(state.library);
    expect(result.current.repositories).toBe(state.repositories);
    expect(result.current.baseAssets).toBe(state.baseAssets);
    expect(result.current.compositions).toBe(state.compositions);
    expect(result.current.monitor).toBe(state.monitor);
    expect(result.current.sessions).toBe(state.sessions);
  });

  it("switches to spanish copy when the shell language is es", () => {
    state.shellState.lang = "es";

    const { result } = renderHook(() => useAppContentDomainState());

    expect(result.current.t).toBe(es);
  });
});
