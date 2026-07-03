import { describe, expect, it } from "vitest";

import { buildWaveformPlaceholderInteractionResetState } from "../../../../src/features/analyzer/components/waveformPlaceholderInteractionResetRuntime";

describe("waveformPlaceholderInteractionResetRuntime", () => {
  it("derives which interaction domains must reset from capabilities", () => {
    expect(
      buildWaveformPlaceholderInteractionResetState({
        canEditBeatGrid: false,
        canSelectPhrase: true,
        canEditPerformance: false,
      }),
    ).toEqual({
      resetBeatGridEditing: true,
      resetPhraseSelection: false,
      resetPerformanceDragging: true,
    });
  });
});
