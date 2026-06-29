import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "../../src/components/AppSidebar";
import { UserModeProvider } from "../../src/features/simple/UserModeContext";
import { I18nContext } from "../../src/i18n/I18nContext";
import { es } from "../../src/i18n/es";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../../src/features/monitor/MonitorContext";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const monitorMetrics: MonitorMetrics = {
  totalLines: 12,
  totalAnomalies: 3,
  avgLinesPerSecond: 1,
  peakLinesPerSecond: 2,
  lastTimestamp: null,
  anomalyBursts: 1,
};

const monitorSession: ActiveMonitorSession = {
  sessionId: "session-1",
  repoId: "repo-1",
  repoTitle: "visits-service",
  sourcePath: "/tmp/visits-service.log",
  startedAt: Date.now() - 12_000,
  trackName: "around.mp3",
  adapterKind: "file",
};

function renderSidebar(props: Partial<ComponentProps<typeof AppSidebar>> = {}) {
  return render(
    <I18nContext.Provider value={es}>
      <UserModeProvider>
        <AppSidebar
          currentPillar="perform"
          onPillarChange={vi.fn()}
          trackCount={4}
          repositoryCount={2}
          baseAssetCount={1}
          compositionCount={3}
          selectedItemTitle="visits-service"
          monitorSession={monitorSession}
          monitorMetrics={monitorMetrics}
          onStopMonitor={vi.fn()}
          onOpenMonitoredRepo={vi.fn()}
          onOpenConnections={vi.fn()}
          connectionsActive={false}
          onHideToBackground={vi.fn()}
          {...props}
        />
      </UserModeProvider>
    </I18nContext.Provider>,
  );
}

describe("AppSidebar", () => {
  it("shows localized connections lane and dispatches connection action", async () => {
    const onOpenConnections = vi.fn();
    renderSidebar({ onOpenConnections, monitorSession: null });

    await screen.findByText("Conectar");
    fireEvent.click(screen.getByRole("button", { name: /Conexiones/i }));

    expect(onOpenConnections).toHaveBeenCalledTimes(1);
  });

  it("shows monitor actions when a live session is active", async () => {
    const onOpenMonitoredRepo = vi.fn();
    const onStopMonitor = vi.fn();

    renderSidebar({ onOpenMonitoredRepo, onStopMonitor });

    await screen.findByRole("button", { name: "Inspeccionar" });
    fireEvent.click(screen.getByRole("button", { name: "Inspeccionar" }));
    fireEvent.click(screen.getByRole("button", { name: "Detener" }));

    expect(onOpenMonitoredRepo).toHaveBeenCalledTimes(1);
    expect(onStopMonitor).toHaveBeenCalledTimes(1);
  });
});
