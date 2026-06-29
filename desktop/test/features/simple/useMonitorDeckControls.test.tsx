import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_MONITOR_DECK_CONTROLS,
  MONITOR_DECK_PRESETS,
} from "../../../src/features/simple/monitorDeckControls";
import { useMonitorDeckControls } from "../../../src/features/simple/useMonitorDeckControls";

describe("useMonitorDeckControls", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("hydrates from storage and exposes update/preset/reset actions", () => {
    window.localStorage.setItem(
      "maia.monitor-deck-controls.v1",
      JSON.stringify({
        ...DEFAULT_MONITOR_DECK_CONTROLS,
        waveformScale: 1.5,
        alertShape: "soft",
      }),
    );

    const { result } = renderHook(() => useMonitorDeckControls());

    expect(result.current.deckControls.waveformScale).toBe(1.5);
    expect(result.current.activePreset).toBe("custom");
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.applyDeckPreset("alert");
    });

    expect(result.current.deckControls).toEqual(MONITOR_DECK_PRESETS.alert);
    expect(result.current.activePreset).toBe("alert");

    act(() => {
      result.current.updateDeckControl("waveformScale", 9);
    });

    expect(result.current.deckControls.waveformScale).toBe(3.5);
    expect(result.current.activePreset).toBe("custom");

    act(() => {
      result.current.resetDeckControls();
    });

    expect(result.current.deckControls).toEqual(DEFAULT_MONITOR_DECK_CONTROLS);
    expect(result.current.isDirty).toBe(false);
  });
});
