import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "../../src/components/AppShell";
import { UserModeProvider } from "../../src/features/simple/UserModeContext";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderShell(props: Partial<ComponentProps<typeof AppShell>> = {}) {
  return render(
    <I18nContext.Provider value={en}>
      <UserModeProvider>
        <AppShell
          currentSection="monitor"
          isMonitoring={true}
          monitoringStatus={{
            source: "visits-service",
            anomalies: 4,
            uptime: "15s",
            confidence: 87,
          }}
          onSectionChange={vi.fn()}
          onInspect={vi.fn()}
          onStopMonitoring={vi.fn()}
          onToggleCollapse={vi.fn()}
          {...props}
        >
          <div>content</div>
        </AppShell>
      </UserModeProvider>
    </I18nContext.Provider>,
  );
}

describe("AppShell", () => {
  it("shows live monitor actions only when monitoring is active", async () => {
    renderShell({ isMonitoring: false });

    await screen.findByText("Monitor");
    expect(screen.queryByText("Listening now")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inspect" })).not.toBeInTheDocument();
  });

  it("dispatches inspect and stop actions from the live monitor badge", async () => {
    const onInspect = vi.fn();
    const onStopMonitoring = vi.fn();

    renderShell({ onInspect, onStopMonitoring });

    await screen.findByText("Listening now");
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));

    expect(onInspect).toHaveBeenCalledTimes(1);
    expect(onStopMonitoring).toHaveBeenCalledTimes(1);
  });
});
