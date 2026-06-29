import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSimpleMonitorAnomalyFilterState } from "../../../src/features/simple/useSimpleMonitorAnomalyFilterState";

describe("useSimpleMonitorAnomalyFilterState", () => {
  it("toggles the anomaly filter and opens the console when it is collapsed", () => {
    const onToggleConsole = vi.fn();

    const { result } = renderHook(() =>
      useSimpleMonitorAnomalyFilterState({
        isConsoleExpanded: false,
        onToggleConsole,
      }),
    );

    expect(result.current.isAnomalyFilterActive).toBe(false);

    act(() => {
      result.current.handleToggleAnomalyFilter();
    });

    expect(result.current.isAnomalyFilterActive).toBe(true);
    expect(onToggleConsole).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleClearAnomalyFilter();
    });

    expect(result.current.isAnomalyFilterActive).toBe(false);
  });
});
