import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMonitor } from "../../../src/features/monitor/MonitorContext";

describe("useMonitor", () => {
  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useMonitor())).toThrow(
      "useMonitor must be called inside <MonitorProvider>",
    );
  });
});
