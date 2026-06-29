import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAppV0ShellState } from "../../src/hooks/useAppV0ShellState";

describe("useAppV0ShellState", () => {
  it("manages section, sidebar and console shell state", () => {
    const { result } = renderHook(() => useAppV0ShellState("library"));

    expect(result.current.currentSection).toBe("library");
    expect(result.current.isSidebarCollapsed).toBe(false);
    expect(result.current.isConsoleExpanded).toBe(false);

    act(() => {
      result.current.toggleSidebarCollapsed();
      result.current.toggleConsoleExpanded();
      result.current.setCurrentSection("connections");
    });

    expect(result.current.currentSection).toBe("connections");
    expect(result.current.isSidebarCollapsed).toBe(true);
    expect(result.current.isConsoleExpanded).toBe(true);

    act(() => {
      result.current.openMonitorInspector();
    });

    expect(result.current.currentSection).toBe("monitor");
    expect(result.current.isConsoleExpanded).toBe(true);
  });
});
