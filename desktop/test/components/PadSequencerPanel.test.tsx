import { cleanup, render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

import { PadSequencerPanel } from "../../src/features/analyzer/components/PadSequencerPanel";
import type { ArrangementVoice } from "../../src/features/analyzer/components/liveSonificationScene";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVoice(routeKey: string): ArrangementVoice {
  return {
    cue: {
      id: "v-1",
      eventIndex: 0,
      level: "info",
      component: "api",
      excerpt: "",
      noteHz: 220,
      durationMs: 120,
      gain: 0.1,
      waveform: "sine",
      accent: "none",
      pan: 0,
      routeKey: routeKey as ArrangementVoice["cue"]["routeKey"],
      routeLabel: routeKey,
      stemLabel: "",
      sectionLabel: "",
      focus: "",
      samplePath: null,
      sampleLabel: null,
    },
    noteMultiplier: 1,
    gainMultiplier: 1,
    panOffset: 0,
    timeOffsetMs: 0,
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("PadSequencerPanel rendering", () => {
  it("renders BPM and step count in the header", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    expect(screen.getByText("128 BPM")).toBeInTheDocument();
    expect(screen.getByText("16 steps · 1 bar")).toBeInTheDocument();
  });

  it("renders 48 step buttons (3 tracks × 16 steps)", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    // buttons include Play, Fill from scene, Clear + 48 step buttons
    const allButtons = screen.getAllByRole("button");
    const stepButtons = allButtons.filter((b) => b.classList.contains("pad-seq-step"));
    expect(stepButtons).toHaveLength(48);
  });

  it("shows humanize slider", () => {
    render(<PadSequencerPanel bpm={120} recentVoices={[]} />);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "50");
  });

  it("shows 'off' when humanize is 0 and updates label on change", () => {
    render(<PadSequencerPanel bpm={120} recentVoices={[]} />);
    expect(screen.getByText("off")).toBeInTheDocument();
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "20" } });
    expect(screen.getByText("±20ms")).toBeInTheDocument();
  });

  it("uses 120 BPM when bpm prop is 0", () => {
    render(<PadSequencerPanel bpm={0} recentVoices={[]} />);
    expect(screen.getByText("120 BPM")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Play / stop
// ---------------------------------------------------------------------------

describe("PadSequencerPanel play/stop", () => {
  it("toggles play label on click", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    const playBtn = screen.getByTitle("Start playhead");
    expect(playBtn).toHaveTextContent("▶ Play");
    fireEvent.click(playBtn);
    expect(screen.getByTitle("Stop playhead")).toHaveTextContent("■ Stop");
  });
});

// ---------------------------------------------------------------------------
// Step toggle
// ---------------------------------------------------------------------------

describe("PadSequencerPanel step toggle", () => {
  it("activates a step button on click", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    const first = stepButtons[0];
    expect(first).not.toHaveClass("pad-seq-step--on");
    fireEvent.click(first);
    expect(first).toHaveClass("pad-seq-step--on");
  });

  it("deactivates an active step on second click", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    const first = stepButtons[0];
    fireEvent.click(first);
    expect(first).toHaveClass("pad-seq-step--on");
    fireEvent.click(first);
    expect(first).not.toHaveClass("pad-seq-step--on");
  });
});

// ---------------------------------------------------------------------------
// Probability cycling
// ---------------------------------------------------------------------------

describe("PadSequencerPanel probability cycling", () => {
  it("right-clicking an active step cycles its prob label 100→75", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    const first = stepButtons[0];
    // Enable the step first
    fireEvent.click(first);
    // Right-click to cycle: 100 → 75
    fireEvent.contextMenu(first);
    expect(first).toHaveClass("pad-seq-step--prob75");
    expect(first.querySelector(".pad-seq-step-prob")).toHaveTextContent("75");
  });

  it("cycles through all prob values: 100 → 75 → 50 → 25 → 100", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    const first = stepButtons[0];
    fireEvent.click(first); // enable

    fireEvent.contextMenu(first); // → 75
    expect(first).toHaveClass("pad-seq-step--prob75");
    fireEvent.contextMenu(first); // → 50
    expect(first).toHaveClass("pad-seq-step--prob50");
    fireEvent.contextMenu(first); // → 25
    expect(first).toHaveClass("pad-seq-step--prob25");
    fireEvent.contextMenu(first); // → 100 (wraps)
    // At 100 the prob class should be absent
    expect(first).not.toHaveClass("pad-seq-step--prob100");
    expect(first.querySelector(".pad-seq-step-prob")).toBeNull();
  });

  it("right-clicking an inactive step does nothing", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[]} />);
    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    const first = stepButtons[0];
    // Step is off — right-click should not add prob class
    fireEvent.contextMenu(first);
    expect(first).not.toHaveClass("pad-seq-step--prob75");
  });
});

// ---------------------------------------------------------------------------
// Fill from scene
// ---------------------------------------------------------------------------

describe("PadSequencerPanel fill from scene", () => {
  it("seeds an info pattern (only foundation on downbeats) from info voices", () => {
    const infoVoice = makeVoice("info");
    render(<PadSequencerPanel bpm={128} recentVoices={[infoVoice]} />);
    fireEvent.click(screen.getByText("Fill from scene"));

    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));

    // Foundation track = first 16 steps. Steps 0,4,8,12 should be on.
    const foundationSteps = stepButtons.slice(0, 16);
    [0, 4, 8, 12].forEach((i) =>
      expect(foundationSteps[i]).toHaveClass("pad-seq-step--on"),
    );
    [1, 2, 3, 5].forEach((i) =>
      expect(foundationSteps[i]).not.toHaveClass("pad-seq-step--on"),
    );
  });

  it("seeds an error pattern (denser) from error voices", () => {
    const errorVoice = makeVoice("error");
    render(<PadSequencerPanel bpm={128} recentVoices={[errorVoice]} />);
    fireEvent.click(screen.getByText("Fill from scene"));

    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));

    // Error foundation = steps 0,2,4,6,8,10,12,14 all on
    const foundationSteps = stepButtons.slice(0, 16);
    [0, 2, 4, 6, 8, 10, 12, 14].forEach((i) =>
      expect(foundationSteps[i]).toHaveClass("pad-seq-step--on"),
    );
  });

  it("clears the probability grid when filling from scene", () => {
    const voice = makeVoice("info");
    render(<PadSequencerPanel bpm={128} recentVoices={[voice]} />);
    // Enable step 0 and cycle its prob to 75
    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    fireEvent.click(stepButtons[0]);
    fireEvent.contextMenu(stepButtons[0]); // 100 → 75

    // Now fill from scene — prob grid should reset
    fireEvent.click(screen.getByText("Fill from scene"));
    // Step 0 is still on (info seed) but prob should be back to 100 (no prob label)
    expect(stepButtons[0].querySelector(".pad-seq-step-prob")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

describe("PadSequencerPanel clear", () => {
  it("clears all steps", () => {
    render(<PadSequencerPanel bpm={128} recentVoices={[makeVoice("error")]} />);
    fireEvent.click(screen.getByText("Fill from scene"));
    fireEvent.click(screen.getByText("Clear"));

    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    stepButtons.forEach((btn) =>
      expect(btn).not.toHaveClass("pad-seq-step--on"),
    );
  });
});

// ---------------------------------------------------------------------------
// onStepFire callback
// ---------------------------------------------------------------------------

describe("PadSequencerPanel onStepFire", () => {
  it("calls onStepFire with enabled steps when playhead advances", async () => {
    vi.useFakeTimers();

    const onStepFire = vi.fn();
    render(
      <PadSequencerPanel bpm={480} recentVoices={[]} onStepFire={onStepFire} />,
    );

    // Enable foundation step 0
    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));
    fireEvent.click(stepButtons[0]);

    // Start playhead
    fireEvent.click(screen.getByTitle("Start playhead"));

    // At 480 BPM, one 16th-note = 60000/480/4 ≈ 31.25ms; advance one tick
    await act(async () => {
      vi.advanceTimersByTime(35);
    });

    expect(onStepFire).toHaveBeenCalledTimes(1);
    const [firings] = onStepFire.mock.calls[0] as [Array<{ track: string; step: number; humanizeOffsetMs: number }>];
    expect(firings).toHaveLength(1);
    expect(firings[0].track).toBe("foundation");
    expect(firings[0].step).toBe(0);
    expect(typeof firings[0].humanizeOffsetMs).toBe("number");

    vi.useRealTimers();
  });

  it("does not fire when probability check fails", async () => {
    vi.useFakeTimers();
    // Force Math.random to return 1 so prob check (random*100 < prob) always fails at prob < 100
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const onStepFire = vi.fn();
    render(
      <PadSequencerPanel bpm={480} recentVoices={[]} onStepFire={onStepFire} />,
    );

    const stepButtons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("pad-seq-step"));

    // Enable step 0 and set prob to 25 (3 right-clicks: 100→75→50→25)
    fireEvent.click(stepButtons[0]);
    fireEvent.contextMenu(stepButtons[0]); // 75
    fireEvent.contextMenu(stepButtons[0]); // 50
    fireEvent.contextMenu(stepButtons[0]); // 25

    fireEvent.click(screen.getByTitle("Start playhead"));
    await act(async () => {
      vi.advanceTimersByTime(35);
    });

    // random() = 0.99, so 0.99*100 = 99 which is NOT < 25 — should not fire
    expect(onStepFire).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
