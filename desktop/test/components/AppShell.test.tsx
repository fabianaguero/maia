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

    await screen.findByText(en.simpleMode.monitor.systemActive);
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));

    expect(onInspect).toHaveBeenCalledTimes(1);
    expect(onStopMonitoring).toHaveBeenCalledTimes(1);
  });

  it("renders collapsed branding and expert stats when pro mode is active", async () => {
    renderShell({
      isCollapsed: true,
      trackCount: 9,
      repositoryCount: 4,
      baseAssetCount: 2,
    });

    fireEvent.click(screen.getByTitle(en.simpleMode.shell.proMode));

    expect(screen.getByAltText("MAIA")).toHaveClass("logo-main");
    expect(screen.queryByText(en.simpleMode.shell.simpleTagline)).not.toBeInTheDocument();
    expect(screen.queryByText(en.simpleMode.shell.expertTagline)).not.toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(en.sidebar.selected)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.simpleMode.shell.expandSidebar }),
    ).toBeInTheDocument();
  });

  it("shows the expert tagline and dispatches navigation and collapse handlers", async () => {
    const onSectionChange = vi.fn();
    const onToggleCollapse = vi.fn();

    renderShell({
      isCollapsed: false,
      onSectionChange,
      onToggleCollapse,
    });

    fireEvent.click(screen.getByTitle(en.simpleMode.shell.proMode));

    expect(screen.getByText(en.simpleMode.shell.expertTagline)).toBeInTheDocument();
    expect(screen.getByTitle(en.simpleMode.shell.proMode)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTitle(en.simpleMode.shell.basicMode)).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.shell.collapseSidebar }));
    fireEvent.click(screen.getByRole("button", { name: /Compose D04/i }));

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    expect(onSectionChange).toHaveBeenCalledWith("compose");
  });
});
