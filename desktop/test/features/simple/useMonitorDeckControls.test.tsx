import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_MONITOR_DECK_CONTROLS,
  MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY,
  MONITOR_DECK_PRESETS,
} from "../../../src/features/simple/monitorDeckControls";
import { useMonitorDeckControls } from "../../../src/features/simple/useMonitorDeckControls";

describe("useMonitorDeckControls", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("hydrates from storage and exposes update/preset/reset actions", () => {
    window.localStorage.setItem(
      MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeSkin: "nightfall",
        profiles: {
          nightfall: {
            ...DEFAULT_MONITOR_DECK_CONTROLS,
            waveformScale: 1.5,
            alertShape: "soft",
          },
        },
      }),
    );

    const { result } = renderHook(() => useMonitorDeckControls({ skin: "nightfall" }));

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

  it("keeps independent profiles per skin when the operator changes booth theme", () => {
    window.localStorage.setItem(
      MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeSkin: "nightfall",
        profiles: {
          nightfall: {
            ...DEFAULT_MONITOR_DECK_CONTROLS,
            waveformScale: 1.4,
          },
          arctic: {
            ...DEFAULT_MONITOR_DECK_CONTROLS,
            waveformScale: 2,
            alertShape: "soft",
          },
        },
      }),
    );

    const { result, rerender } = renderHook(({ skin }) => useMonitorDeckControls({ skin }), {
      initialProps: { skin: "nightfall" as const },
    });

    expect(result.current.deckControls.waveformScale).toBe(1.4);

    rerender({ skin: "arctic" });

    expect(result.current.deckControls.waveformScale).toBe(2);
    expect(result.current.deckControls.alertShape).toBe("soft");
  });
});
