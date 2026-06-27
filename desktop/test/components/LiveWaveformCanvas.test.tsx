import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveWaveformCanvas } from "../../src/features/analyzer/components/LiveWaveformCanvas";

describe("LiveWaveformCanvas", () => {
  it("renders the canvas shell even when inactive", () => {
    render(
      <LiveWaveformCanvas analyserRef={{ current: null }} active={false} accentColor="#00ffff" />,
    );

    const canvas = document.querySelector("canvas.live-waveform-canvas");
    expect(canvas).toBeInTheDocument();
    expect(screen.queryByText(/canvas/i)).not.toBeInTheDocument();
  });
});
