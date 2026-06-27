import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorLaunchPanel } from "../../src/features/analyzer/components/LiveLogMonitorLaunchPanel";

describe("LiveLogMonitorLaunchPanel", () => {
  it("renders launch controls and starts monitoring", () => {
    const onStart = vi.fn();
    const onChangeStyleProfileId = vi.fn();

    render(
      <LiveLogMonitorLaunchPanel
        adapterKind="file"
        adapterLabel="FILE_TAIL"
        adapterDescription="Passive file tail adapter"
        adapterTarget="/logs/visits-service.log"
        fileTailLabel="File tail"
        selectedStyleProfileId="warehouse"
        selectedMutationProfileId="warning-swell"
        selectedStyleLabel="Warehouse"
        selectedMutationLabel="Warning swell"
        selectedStyleDescription="Solid bed"
        selectedMutationDescription="Sharper anomalies"
        styleOptions={[
          { id: "warehouse", label: "Warehouse" },
          { id: "deep", label: "Deep" },
        ]}
        mutationOptions={[
          { id: "warning-swell", label: "Warning swell" },
          { id: "soft", label: "Soft" },
        ]}
        forcedLiveMutationState="auto"
        hasBaseListeningBed
        baseBedStatusLabel="2 sounds armed"
        adapterConfigured
        cueEnginePreviewLabel="Sample pack"
        liveMutationStateLabel="Warning"
        forcedStateDetail="Log driven"
        isStarting={false}
        error="Connection failed"
        labels={{
          signalFeedTitle: "Signal feed",
          weekOnePipeline: "Week one pipeline",
          targetLabel: "Target",
          sceneLaunchTitle: "Scene launch",
          styleProfileTitle: "Style profile",
          mutationProfileTitle: "Mutation profile",
          auditionOverrideTitle: "Audition override",
          auditionAuto: "Auto",
          auditionNormal: "Normal",
          auditionWarning: "Warning",
          auditionCritical: "Critical",
          baseBedLabel: "Base bed",
          sourceFeedLabel: "Source feed",
          cueEngineLabel: "Cue engine",
          ready: "Ready",
          needsConfig: "Needs config",
          recommended: "Recommended",
          synthOnlyHint: "Synth only",
          auditionOverridePrefix: "Audition override",
          liveLogDriven: "Live log driven",
          forcedStateNormal: "Forced normal",
          forcedStateWarning: "Forced warning",
          forcedStateCritical: "Forced critical",
          startMonitor: "Start monitor",
          starting: "Starting",
          feedTarget: "Feed target {target}",
          configureFeedBeforeStart: "Configure feed before start",
          errorPrefix: "Error",
        }}
        onChangeAdapterKind={vi.fn()}
        onChangeStyleProfileId={onChangeStyleProfileId}
        onChangeMutationProfileId={vi.fn()}
        onChangeForcedState={vi.fn()}
        onStart={onStart}
      />,
    );

    fireEvent.change(screen.getByTitle("Style profile"), { target: { value: "deep" } });
    fireEvent.click(screen.getByText("Start monitor"));

    expect(screen.getByText("FILE_TAIL")).toBeTruthy();
    expect(screen.getByText("Error: Connection failed")).toBeTruthy();
    expect(onChangeStyleProfileId).toHaveBeenCalledWith("deep");
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
