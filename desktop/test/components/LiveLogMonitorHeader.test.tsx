import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorHeader } from "../../src/features/analyzer/components/LiveLogMonitorHeader";

describe("LiveLogMonitorHeader", () => {
  it("renders deck actions and delegates callbacks", () => {
    const onEnsureAudioReady = vi.fn();
    const onPlayTestTone = vi.fn();
    const onStop = vi.fn();
    const onBounce = vi.fn();

    render(
      <LiveLogMonitorHeader
        title="Live monitor"
        subtitle="Deck subtitle"
        deckStatusLabel="IDLE"
        activeAdapterLabel="FILE_TAIL"
        audioBadgeTone="ready"
        audioBadgeLabel="AUDIO READY"
        audioBadgeTitle="Audio engine active"
        testAudioLabel="Test audio"
        liveEnabled
        stopLabel="Stop monitor"
        bounceAction={{ label: "Bounce", title: "Export live bounce" }}
        onEnsureAudioReady={onEnsureAudioReady}
        onPlayTestTone={onPlayTestTone}
        onStop={onStop}
        onBounce={onBounce}
      />,
    );

    fireEvent.click(screen.getByText("AUDIO READY"));
    fireEvent.click(screen.getByText("Test audio"));
    fireEvent.click(screen.getByText("Stop monitor"));
    fireEvent.click(screen.getByText("Bounce"));

    expect(onEnsureAudioReady).toHaveBeenCalledTimes(1);
    expect(onPlayTestTone).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onBounce).toHaveBeenCalledTimes(1);
  });
});
