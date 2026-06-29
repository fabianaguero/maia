import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TrackCueList } from "../../src/features/analyzer/components/TrackCueList";
import type { TrackCuePoint } from "../../src/types/library";

const cues: TrackCuePoint[] = [
  {
    id: "cue-1",
    slot: 1,
    second: 12.5,
    label: "Drop",
    kind: "hot",
    color: null,
  },
];

describe("TrackCueList", () => {
  it("renders cue rows and delegates edit actions", () => {
    const onPatchCue = vi.fn();
    const onRemoveCue = vi.fn();

    render(
      <TrackCueList
        cues={cues}
        cueKind="hot"
        canEditPerformance
        sectionLabel="Hot cues"
        emptyLabel="No cues"
        labelText="Label"
        colorText="Color"
        removeText={(name) => `Remove ${name}`}
        slotTemplate="Slot {slot}"
        onPatchCue={onPatchCue}
        onRemoveCue={onRemoveCue}
        renderCueLabel={(cue, slotTemplate) => `${cue.label} · ${slotTemplate}`}
        colorOptions={[
          { value: "", label: "None" },
          { value: "#22d3ee", label: "Cyan" },
        ]}
      />,
    );

    fireEvent.blur(screen.getByLabelText("Label cue-1"), {
      target: { value: "Intro" },
    });
    fireEvent.change(screen.getByLabelText("Color cue-1"), {
      target: { value: "#22d3ee" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove Drop" }));

    expect(onPatchCue).toHaveBeenCalledWith("hot", "cue-1", { label: "Intro" });
    expect(onPatchCue).toHaveBeenCalledWith("hot", "cue-1", { color: "#22d3ee" });
    expect(onRemoveCue).toHaveBeenCalledWith("hot", "cue-1");
  });
});
