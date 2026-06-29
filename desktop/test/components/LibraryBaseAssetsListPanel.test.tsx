import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { LibraryBaseAssetsListPanel } from "../../src/features/library/components/LibraryBaseAssetsListPanel";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("LibraryBaseAssetsListPanel", () => {
  it("selects assets and exposes inspect/compose actions for ready packs", () => {
    const onInspectBaseAsset = vi.fn();
    const onSelectBaseAsset = vi.fn();

    renderWithI18n(
      <LibraryBaseAssetsListPanel
        assets={[
          {
            id: "base-1",
            title: "Glitch pack",
            categoryLabel: "Reactive",
            entryCount: 12,
            reusable: true,
            importedAt: "2026-06-28T12:00:00.000Z",
            analyzerStatus: "ready",
          } as never,
          {
            id: "base-2",
            title: "Ambient pack",
            categoryLabel: "Textural",
            entryCount: 8,
            reusable: false,
            importedAt: "2026-06-28T13:00:00.000Z",
            analyzerStatus: "pending",
          } as never,
        ]}
        newlyImportedId="base-1"
        selectedBaseAssetId="base-2"
        onInspectBaseAsset={onInspectBaseAsset}
        onSelectBaseAsset={onSelectBaseAsset}
      />,
    );

    fireEvent.click(screen.getByText("Ambient pack"));
    expect(onSelectBaseAsset).toHaveBeenCalledWith("base-2");

    fireEvent.click(screen.getAllByRole("button", { name: en.library.analyze })[0]);
    expect(onInspectBaseAsset).toHaveBeenCalledWith("base-1");

    fireEvent.click(screen.getByRole("button", { name: `${en.library.compose} →` }));
    expect(onInspectBaseAsset).toHaveBeenCalledWith("base-1");
  });
});
