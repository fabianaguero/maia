import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWaveformPlaceholderInteractionState } from "../../../../src/features/analyzer/components/useWaveformPlaceholderInteractionState";

describe("useWaveformPlaceholderInteractionState", () => {
  it("initializes waveform interaction state and refs", () => {
    const { result } = renderHook(() => useWaveformPlaceholderInteractionState());

    expect(result.current.gridClickArmed).toBe(false);
    expect(result.current.phraseSelectArmed).toBe(false);
    expect(result.current.gridAnchorDragging).toBe(false);
    expect(result.current.dragAnchorSecond).toBeNull();
    expect(result.current.dragTarget).toBeNull();
    expect(result.current.dragEditSecond).toBeNull();
    expect(result.current.stageRef.current).toBeNull();
    expect(result.current.dragAnchorSecondRef.current).toBeNull();
    expect(result.current.dragEditSecondRef.current).toBeNull();
    expect(result.current.dragMovedRef.current).toBe(false);
    expect(result.current.dragStartClientXRef.current).toBeNull();
  });
});
