import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WaveformPlaceholder } from "../../src/features/analyzer/components/WaveformPlaceholder";

function mockStageRect(stage: HTMLDivElement) {
  Object.defineProperty(stage, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width: 200,
      left: 0,
      top: 0,
      right: 200,
      bottom: 120,
      height: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
}

describe("WaveformPlaceholder", () => {
  afterEach(() => {
    cleanup();
  });

  it("seeks normally when grid click mode is not armed", () => {
    const onSeek = vi.fn();
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={[{ index: 0, second: 0 }]}
        durationSeconds={100}
        onSeek={onSeek}
      />,
    );

    const stage = container.querySelector(".waveform-stage") as HTMLDivElement;
    mockStageRect(stage);

    fireEvent.click(stage, { clientX: 100 });

    expect(onSeek).toHaveBeenCalledWith(50);
  });

  it("arms direct beat grid editing and sends the clicked second as downbeat", () => {
    const onSeek = vi.fn();
    const onSetDownbeatAtSecond = vi.fn();
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={[{ index: 0, second: 0 }]}
        durationSeconds={120}
        onSeek={onSeek}
        canEditBeatGrid
        onSetDownbeatAtSecond={onSetDownbeatAtSecond}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Arm downbeat click" }));

    const stage = container.querySelector(".waveform-stage") as HTMLDivElement;
    mockStageRect(stage);
    fireEvent.click(stage, { clientX: 50 });

    expect(onSetDownbeatAtSecond).toHaveBeenCalledWith(30);
    expect(onSeek).not.toHaveBeenCalled();
    expect(screen.queryByText(/Click the waveform to place beat 1/i)).not.toBeInTheDocument();
  });

  it("supports dragging the beat grid anchor directly on the waveform", () => {
    const onSeek = vi.fn();
    const onSetDownbeatAtSecond = vi.fn();
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={[
          { index: 0, second: 10 },
          { index: 1, second: 10.5 },
        ]}
        durationSeconds={120}
        onSeek={onSeek}
        canEditBeatGrid
        onSetDownbeatAtSecond={onSetDownbeatAtSecond}
      />,
    );

    const stage = container.querySelector(".waveform-stage") as HTMLDivElement;
    mockStageRect(stage);

    fireEvent.mouseDown(screen.getByRole("button", { name: "Drag beat grid anchor" }));
    fireEvent.mouseMove(window, { clientX: 120 });
    fireEvent.mouseUp(window);

    expect(onSetDownbeatAtSecond).toHaveBeenCalledWith(72);
    expect(onSeek).not.toHaveBeenCalled();
  });

  it("captures phrase-aligned selections directly from the waveform", () => {
    const onSeek = vi.fn();
    const onSelectPhraseRange = vi.fn();
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={40}
        onSeek={onSeek}
        canSelectPhrase
        onSelectPhraseRange={onSelectPhraseRange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Arm phrase select" }));

    const stage = container.querySelector(".waveform-stage") as HTMLDivElement;
    mockStageRect(stage);
    fireEvent.click(stage, { clientX: 20 });

    expect(onSelectPhraseRange).toHaveBeenCalledWith({
      startSecond: 0,
      endSecond: 8,
      startBeatIndex: 0,
      endBeatIndex: 16,
      beatCount: 16,
      label: "Phrase 1",
    });
    expect(onSeek).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/Click the waveform to capture a 16-beat phrase/i),
    ).not.toBeInTheDocument();
  });

  it("renders bar and phrase guide labels from the beat grid", () => {
    render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 17 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={16}
      />,
    );

    expect(screen.getByText("Phrase 1")).toBeInTheDocument();
    expect(screen.getByText("Bar 2")).toBeInTheDocument();
  });

  it("lets the user seek directly from cue and loop overlays", () => {
    const onSeek = vi.fn();

    render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 17 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={16}
        onSeek={onSeek}
        hotCues={[
          {
            second: 3.5,
            label: "Drop",
            type: "hot",
          },
        ]}
        regions={[
          {
            id: "loop-1",
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            type: "loop",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Seek to cue Drop" }));
    fireEvent.click(screen.getByRole("button", { name: "Seek to Loop A" }));

    expect(onSeek).toHaveBeenCalledWith(3.5);
    expect(onSeek).toHaveBeenCalledWith(8);
  });

  it("drags cues and loop boundaries directly on the waveform", () => {
    const onSeek = vi.fn();
    const onMoveCue = vi.fn();
    const onMoveLoopBoundary = vi.fn();
    const onMoveLoop = vi.fn();
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={40}
        onSeek={onSeek}
        canEditPerformance
        editableCues={[
          {
            id: "hot-1",
            second: 4,
            label: "Drop",
            kind: "hot",
          },
        ]}
        editableLoops={[
          {
            id: "loop-1",
            slot: 1,
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            color: null,
            locked: false,
          },
        ]}
        hotCues={[
          {
            second: 4,
            label: "Drop",
            type: "hot",
          },
        ]}
        regions={[
          {
            id: "loop-1",
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            type: "loop",
          },
        ]}
        onMoveCue={onMoveCue}
        onMoveLoopBoundary={onMoveLoopBoundary}
        onMoveLoop={onMoveLoop}
      />,
    );

    const stage = container.querySelector(".waveform-stage") as HTMLDivElement;
    mockStageRect(stage);

    fireEvent.mouseDown(screen.getByRole("button", { name: "Seek to cue Drop" }), {
      clientX: 20,
    });
    fireEvent.mouseMove(window, { clientX: 60 });
    fireEvent.mouseUp(window);

    fireEvent.mouseDown(screen.getByRole("button", { name: "Drag end of Loop A" }), {
      clientX: 60,
    });
    fireEvent.mouseMove(window, { clientX: 80 });
    fireEvent.mouseUp(window);

    fireEvent.mouseDown(screen.getByRole("button", { name: "Seek to Loop A" }), {
      clientX: 50,
    });
    fireEvent.mouseMove(window, { clientX: 80 });
    fireEvent.mouseUp(window);

    expect(onMoveCue).toHaveBeenCalledWith(
      {
        id: "hot-1",
        second: 4,
        label: "Drop",
        kind: "hot",
      },
      12,
    );
    expect(onMoveLoopBoundary).toHaveBeenCalledWith("loop-1", "end", 16);
    expect(onMoveLoop).toHaveBeenCalledWith("loop-1", 14);
    expect(onSeek).not.toHaveBeenCalled();
  });

  it("ignores residual cue clicks after a drag and skips keyboard nudging for non-editable cues", () => {
    vi.useFakeTimers();
    const onSeek = vi.fn();
    const onMoveCue = vi.fn();
    const onNudgeCue = vi.fn();
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={40}
        onSeek={onSeek}
        canEditPerformance
        editableCues={[
          {
            id: "hot-1",
            second: 4,
            label: "Drop",
            kind: "hot",
          },
        ]}
        hotCues={[
          {
            second: 4,
            label: "Drop",
            type: "hot",
          },
        ]}
        onMoveCue={onMoveCue}
        onNudgeCue={onNudgeCue}
      />,
    );

    const stage = container.querySelector(".waveform-stage") as HTMLDivElement;
    mockStageRect(stage);

    const editableCue = screen.getByRole("button", { name: "Seek to cue Drop" });
    fireEvent.mouseDown(editableCue, { clientX: 20 });
    fireEvent.mouseMove(window, { clientX: 60 });
    fireEvent.mouseUp(window);
    fireEvent.click(editableCue);

    expect(onMoveCue).toHaveBeenCalledWith(
      {
        id: "hot-1",
        second: 4,
        label: "Drop",
        kind: "hot",
      },
      12,
    );
    expect(onSeek).not.toHaveBeenCalled();

    vi.runAllTimers();

    cleanup();

    render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={40}
        onSeek={onSeek}
        canEditPerformance
        hotCues={[
          {
            second: 10,
            label: "Marker",
            type: "memory",
          },
        ]}
        onNudgeCue={onNudgeCue}
      />,
    );

    const nonInteractiveCue = screen.getByRole("button", { name: "Seek to cue Marker" });
    fireEvent.keyDown(nonInteractiveCue, { key: "ArrowRight" });

    expect(onNudgeCue).not.toHaveBeenCalled();
  });

  it("supports keyboard nudge and slip on cue markers", () => {
    const onSeek = vi.fn();
    const onNudgeCue = vi.fn();

    render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={40}
        onSeek={onSeek}
        canEditPerformance
        editableCues={[
          {
            id: "hot-1",
            second: 4,
            label: "Drop",
            kind: "hot",
          },
        ]}
        hotCues={[
          {
            second: 4,
            label: "Drop",
            type: "hot",
          },
        ]}
        onNudgeCue={onNudgeCue}
      />,
    );

    const cueButton = screen.getByRole("button", { name: "Seek to cue Drop" });

    fireEvent.keyDown(cueButton, { key: "Enter" });
    fireEvent.keyDown(cueButton, { key: "ArrowRight" });
    fireEvent.keyDown(cueButton, { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(cueButton, { key: "ArrowLeft", altKey: true });

    expect(onNudgeCue).toHaveBeenCalledTimes(3);
    expect(onNudgeCue).toHaveBeenCalledWith(
      {
        id: "hot-1",
        second: 4,
        label: "Drop",
        kind: "hot",
      },
      4.5,
    );
    expect(onNudgeCue).toHaveBeenCalledWith(
      {
        id: "hot-1",
        second: 4,
        label: "Drop",
        kind: "hot",
      },
      6,
    );
    expect(onNudgeCue).toHaveBeenCalledWith(
      {
        id: "hot-1",
        second: 4,
        label: "Drop",
        kind: "hot",
      },
      3.98,
    );
    expect(onSeek).not.toHaveBeenCalled();
  });

  it("supports keyboard nudge and slip on loops and loop boundaries", () => {
    const onSeek = vi.fn();
    const onMoveLoop = vi.fn();
    const onMoveLoopBoundary = vi.fn();

    render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        durationSeconds={40}
        onSeek={onSeek}
        canEditPerformance
        editableLoops={[
          {
            id: "loop-1",
            slot: 1,
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            color: null,
            locked: false,
          },
        ]}
        regions={[
          {
            id: "loop-1",
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            type: "loop",
          },
        ]}
        onMoveLoop={onMoveLoop}
        onMoveLoopBoundary={onMoveLoopBoundary}
      />,
    );

    const loopRegion = screen.getByRole("button", { name: "Seek to Loop A" });
    const loopStartHandle = screen.getByRole("button", { name: "Drag start of Loop A" });
    const loopEndHandle = screen.getByRole("button", { name: "Drag end of Loop A" });

    fireEvent.keyDown(loopRegion, { key: "ArrowRight" });
    fireEvent.keyDown(loopStartHandle, { key: "ArrowLeft", altKey: true });
    fireEvent.keyDown(loopEndHandle, { key: "ArrowRight", shiftKey: true });

    expect(onMoveLoop).toHaveBeenCalledWith("loop-1", 8.5);
    expect(onMoveLoopBoundary).toHaveBeenCalledWith("loop-1", "start", 7.98);
    expect(onMoveLoopBoundary).toHaveBeenCalledWith("loop-1", "end", 14);
    expect(onSeek).not.toHaveBeenCalled();
  });

  it("renders selected phrase summaries and omits playhead overlays without a duration", () => {
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={[]}
        durationSeconds={null}
        currentTime={5}
        canSelectPhrase
        onSelectPhraseRange={vi.fn()}
        selectedPhraseRange={{
          startSecond: 4,
          endSecond: 12,
          startBeatIndex: 8,
          endBeatIndex: 24,
          beatCount: 16,
          label: "Phrase 2",
        }}
      />,
    );

    expect(screen.getByText("Phrase 2 · 16 beats")).toBeInTheDocument();
    expect(container.querySelector(".waveform-progress-mask")).toBeNull();
    expect(container.querySelector(".waveform-playhead")).toBeNull();
  });

  it("renders pending grid state, empty phrase state, and the analysis completion marker", () => {
    const { container } = render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={[]}
        durationSeconds={20}
        analysisProgress={0.42}
        canSelectPhrase
        onSelectPhraseRange={vi.fn()}
      />,
    );

    const analysisMarker = container.querySelector(".waveform-analysis-end");
    expect(analysisMarker).not.toBeNull();
    expect(analysisMarker).toHaveAttribute("title", "Analysis complete up to this point (42%)");
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("renders non-seekable loop and cue overlays without interactive editing affordances", () => {
    const onMoveCue = vi.fn();
    render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={[]}
        durationSeconds={null}
        canEditPerformance
        hotCues={[
          {
            second: 10,
            label: "Marker",
            type: "memory",
          },
        ]}
        editableLoops={[
          {
            id: "loop-1",
            slot: 1,
            startSecond: 4,
            endSecond: 8,
            label: "Loop A",
            color: null,
            locked: false,
          },
        ]}
        regions={[
          {
            id: "loop-1",
            startSecond: 4,
            endSecond: 8,
            label: "Loop A",
            type: "loop",
          },
        ]}
        onMoveCue={onMoveCue}
      />,
    );

    const loopRegion = screen.getByRole("button", { name: "Seek to Loop A" });
    const cueButton = screen.getByRole("button", { name: "Seek to cue Marker" });

    expect(loopRegion).toHaveAttribute("tabindex", "0");
    expect(loopRegion).toHaveAttribute("aria-disabled", "true");
    expect(cueButton).toBeDisabled();

    fireEvent.mouseDown(cueButton, { clientX: 20 });

    expect(onMoveCue).not.toHaveBeenCalled();
  });

  it("does not start cue dragging when seeking is allowed but cue editing is disabled", () => {
    const onSeek = vi.fn();
    const onMoveCue = vi.fn();

    render(
      <WaveformPlaceholder
        bins={[0.1, 0.3, 0.6]}
        beatGrid={[]}
        durationSeconds={20}
        onSeek={onSeek}
        editableCues={[
          {
            id: "hot-1",
            second: 5,
            label: "Drop",
            kind: "hot",
          },
        ]}
        hotCues={[
          {
            second: 5,
            label: "Drop",
            type: "hot",
          },
        ]}
        onMoveCue={onMoveCue}
      />,
    );

    const cueButton = screen.getByRole("button", { name: "Seek to cue Drop" });
    fireEvent.mouseDown(cueButton, { clientX: 40 });
    fireEvent.click(cueButton);

    expect(onMoveCue).not.toHaveBeenCalled();
    expect(onSeek).toHaveBeenCalledWith(5);
  });
});
