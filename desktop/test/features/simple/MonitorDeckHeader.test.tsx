import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MonitorDeckHeader } from "../../../src/features/simple/MonitorDeckHeader";

vi.mock("../../../src/i18n/I18nContext", () => ({
  useT: () => ({
    simpleMode: {
      monitor: {
        waveformTitle: "Wave monitor",
        trackAudio: "Track audio",
        logStream: "Log stream",
        trackSource: "Track source",
        logSource: "Log source",
        anomalySeverityLegend: "Severity legend",
      },
    },
  }),
}));

describe("MonitorDeckHeader", () => {
  it("renders source cards, legend, chips, and active focus bar", () => {
    const { container } = render(
      <MonitorDeckHeader
        deckTrackLine="Donna Summer · House"
        logSourceLine="/logs/orders.log"
        legendItems={[
          { key: "track", label: "Track", tone: "track" },
          { key: "warn", label: "Warn", tone: "warn" },
        ]}
        metaChips={[
          { key: "bpm", label: "BPM 126" },
          { key: "elapsed", label: "0:45", subtle: true },
        ]}
        focusBadgeLabel="Anomaly"
        focusBadgeTone="critical"
        focusTimestamp="00:45"
        focusMessage="Spike on payments-service"
        focusCueCode="anomaly-42"
        focusBurstLabel="Burst 8"
      />,
    );

    expect(screen.getByText("Wave monitor")).toBeInTheDocument();
    expect(screen.getByText("Donna Summer · House")).toBeInTheDocument();
    expect(screen.getByText("/logs/orders.log")).toBeInTheDocument();
    expect(screen.getByLabelText("Track source")).toHaveAttribute("title", "Donna Summer · House");
    expect(screen.getByLabelText("Log source")).toHaveAttribute("title", "/logs/orders.log");
    expect(screen.getByLabelText("Severity legend")).toBeInTheDocument();
    expect(screen.getByText("BPM 126")).toBeInTheDocument();
    expect(screen.getByText("Spike on payments-service")).toBeInTheDocument();
    expect(screen.getByText("Burst 8")).toBeInTheDocument();
    expect(container.querySelector(".monitor-deck-focusbar.critical")).not.toBeNull();
    expect(screen.getByText(/^A-\d{4}$/)).toBeInTheDocument();
  });

  it("omits focus bar when required anomaly fields are incomplete", () => {
    const { container } = render(
      <MonitorDeckHeader
        deckTrackLine="Track line"
        logSourceLine="Log line"
        legendItems={[]}
        metaChips={[]}
        focusBadgeLabel="Anomaly"
        focusBadgeTone="warning"
        focusTimestamp={null}
        focusMessage="Missing timestamp"
        focusCueCode="anomaly-7"
        focusBurstLabel={null}
      />,
    );

    expect(container.querySelector(".monitor-deck-focusbar.warning")).toBeNull();
  });
});
