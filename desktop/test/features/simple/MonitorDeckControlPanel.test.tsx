import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { MonitorDeckControlPanel } from "../../../src/features/simple/MonitorDeckControlPanel";

describe("MonitorDeckControlPanel", () => {
  it("renders the grouped controls and emits reset/change actions", () => {
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <I18nContext.Provider value={en}>
        <MonitorDeckControlPanel
          controls={DEFAULT_MONITOR_DECK_CONTROLS}
          onChange={onChange}
          onReset={onReset}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByText(en.simpleMode.deckSetup.waveTimingRack)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.deckSetup.responseRack)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.deckSetup.outputRack)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.deckSetup.reset }));
    expect(onReset).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(en.simpleMode.deckSetup.waveZoom), {
      target: { value: "1.4" },
    });
    expect(onChange).toHaveBeenCalledWith("waveformScale", 1.4);

    fireEvent.change(screen.getByLabelText(en.simpleMode.deckSetup.alertShape), {
      target: { value: "aggressive" },
    });
    expect(onChange).toHaveBeenCalledWith("alertShape", "aggressive");
  });
});
