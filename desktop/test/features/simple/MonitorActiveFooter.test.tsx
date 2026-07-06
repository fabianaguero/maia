import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MonitorActiveFooter } from "../../../src/features/simple/MonitorActiveFooter";

describe("MonitorActiveFooter", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders status pills and a localized audio action when a label exists", () => {
    const onResumeAudio = vi.fn();

    render(
      <MonitorActiveFooter
        statusPills={[
          { key: "stream", label: "Log engine", value: "Live", tone: "live" },
          { key: "audio", label: "Audio", value: "Paused", tone: "muted" },
        ]}
        audioStatus="running"
        audioActionLabel="Resume audio"
        onResumeAudio={onResumeAudio}
      />,
    );

    expect(screen.getByText("Log engine")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resume audio" })).toHaveClass("is-live");

    fireEvent.click(screen.getByRole("button", { name: "Resume audio" }));
    expect(onResumeAudio).toHaveBeenCalledTimes(1);
  });

  it("omits the audio action when no label is available", () => {
    render(
      <MonitorActiveFooter
        statusPills={[{ key: "stream", label: "Log engine", value: "Idle", tone: "neutral" }]}
        audioStatus="suspended"
        audioActionLabel={undefined}
        onResumeAudio={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
