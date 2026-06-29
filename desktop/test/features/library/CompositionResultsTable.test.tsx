import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { CompositionResultsTable } from "../../../src/features/library/components/CompositionResultsTable";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("CompositionResultsTable", () => {
  it("renders compositions across timing-source labels and routes selection/inspect", () => {
    const onSelectComposition = vi.fn();
    const onInspectComposition = vi.fn();

    const { container, getAllByRole, getByText } = renderWithI18n(
      <CompositionResultsTable
        compositions={[
          {
            id: "composition-1",
            title: "Night scene",
            summary: "Steady deck",
            baseAssetTitle: "Drum kit",
            baseAssetCategoryLabel: "Drums",
            referenceTitle: "Track A",
            referenceType: "track",
            targetBpm: 126,
            strategy: "balanced",
            analyzerStatus: "ready",
            importedAt: "2026-06-29T10:00:00.000Z",
          } as never,
          {
            id: "composition-2",
            title: "Playlist scene",
            summary: "Blend",
            baseAssetTitle: "Pads",
            baseAssetCategoryLabel: "Textures",
            referenceTitle: "Playlist X",
            referenceType: "playlist",
            targetBpm: 123,
            strategy: "smooth",
            analyzerStatus: "ready",
            importedAt: "2026-06-29T11:00:00.000Z",
          } as never,
          {
            id: "composition-3",
            title: "Repo scene",
            summary: "Ops",
            baseAssetTitle: "FX",
            baseAssetCategoryLabel: "FX",
            referenceTitle: "repo",
            referenceType: "repo",
            targetBpm: 120,
            strategy: "alert",
            analyzerStatus: "ready",
            importedAt: "2026-06-29T12:00:00.000Z",
          } as never,
          {
            id: "composition-4",
            title: "Manual scene",
            summary: "Fixed",
            baseAssetTitle: "Bass",
            baseAssetCategoryLabel: "Bass",
            referenceTitle: "Manual 124 BPM",
            referenceType: "manual",
            targetBpm: 124,
            strategy: "manual",
            analyzerStatus: "ready",
            importedAt: "2026-06-29T12:30:00.000Z",
          } as never,
        ]}
        selectedCompositionId="composition-1"
        onSelectComposition={onSelectComposition}
        onInspectComposition={onInspectComposition}
      />,
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0]?.className).toContain("selected");
    expect(container.textContent).toContain(en.compose.table.baseTrack);
    expect(container.textContent).toContain(en.compose.table.basePlaylist);
    expect(container.textContent).toContain(en.compose.table.structureSource);
    expect(container.textContent).toContain(en.compose.table.manualBpm);

    fireEvent.click(getByText("Night scene"));
    fireEvent.click(getAllByRole("button", { name: en.compose.table.open })[0]!);

    expect(onSelectComposition).toHaveBeenCalledWith("composition-1");
    expect(onInspectComposition).toHaveBeenCalledWith("composition-1");
  });
});
