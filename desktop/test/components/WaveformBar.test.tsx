import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WaveformBar } from "../../src/components/WaveformBar";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

vi.mock("../../src/components/waveformBarViewModel", () => ({
  buildLogChannelBars: () => [
    { height: "30%", animationDelay: "0s", opacity: 0.88 },
    { height: "50%", animationDelay: "0.05s", opacity: 0.92 },
  ],
  buildAlertChannelBars: () => [
    { height: "60%", animationDelay: "0s", filter: "brightness(1.4)" },
    { height: "80%", animationDelay: "0.05s", filter: "brightness(1.4)" },
  ],
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderBar(props: Partial<React.ComponentProps<typeof WaveformBar>> = {}) {
  return render(
    <I18nContext.Provider value={en}>
      <WaveformBar
        isActive={true}
        source="visits-service"
        anomalies={6}
        uptime="25s"
        onInspect={vi.fn()}
        onStop={vi.fn()}
        {...props}
      />
    </I18nContext.Provider>,
  );
}

describe("WaveformBar", () => {
  it("renders monitoring status, metrics and control actions", () => {
    const onInspect = vi.fn();
    const onStop = vi.fn();
    const { container } = renderBar({ onInspect, onStop });

    expect(screen.getByText(en.simpleMode.shell.monitoringActive)).toBeInTheDocument();
    expect(screen.getByText("visits-service")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("25s")).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.shell.logChannel)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.shell.alertChannel)).toBeInTheDocument();

    const cyanBars = container.querySelectorAll(".mini-bar.cyan");
    const orangeBars = container.querySelectorAll(".mini-bar.orange");
    expect(cyanBars).toHaveLength(2);
    expect(orangeBars).toHaveLength(2);
    expect(cyanBars[0]).toHaveStyle({ height: "30%", animationDelay: "0s" });
    expect(orangeBars[1]).toHaveStyle({ height: "80%", animationDelay: "0.05s" });

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.common.inspect }));
    fireEvent.click(container.querySelector(".btn-professional-stop") as HTMLButtonElement);

    expect(onInspect).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("returns null when the bar is inactive", () => {
    const { container } = renderBar({ isActive: false });
    expect(container.firstChild).toBeNull();
  });
});
