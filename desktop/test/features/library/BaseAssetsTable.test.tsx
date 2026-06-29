import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { BaseAssetsTable } from "../../../src/features/library/components/BaseAssetsTable";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("BaseAssetsTable", () => {
  it("renders file and directory base assets and routes row/open actions", () => {
    const onSelectBaseAsset = vi.fn();
    const onInspectBaseAsset = vi.fn();

    const { container, getAllByRole, getByText } = renderWithI18n(
      <BaseAssetsTable
        baseAssets={[
          {
            id: "asset-1",
            title: "Drum kit",
            sourcePath: "/packs/drums",
            sourceKind: "directory",
            categoryLabel: "Drums",
            entryCount: 24,
            reusable: true,
            analyzerStatus: "ready",
            importedAt: "2026-06-29T10:00:00.000Z",
          } as never,
          {
            id: "asset-2",
            title: "Impact.wav",
            sourcePath: "/samples/impact.wav",
            sourceKind: "file",
            categoryLabel: "FX",
            entryCount: 1,
            reusable: false,
            analyzerStatus: "pending",
            importedAt: "2026-06-29T11:00:00.000Z",
          } as never,
        ]}
        selectedBaseAssetId="asset-1"
        onSelectBaseAsset={onSelectBaseAsset}
        onInspectBaseAsset={onInspectBaseAsset}
      />,
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0]?.className).toContain("selected");
    expect(container.textContent).toContain(en.library.forms.baseAsset.folderPack);
    expect(container.textContent).toContain(en.library.forms.baseAsset.singleFile);
    expect(container.textContent).toContain(en.inspect.yes);
    expect(container.textContent).toContain(en.library.tables.baseAssets.no);

    fireEvent.click(getByText("Drum kit"));
    fireEvent.click(getAllByRole("button", { name: en.library.tables.baseAssets.open })[0]!);

    expect(onSelectBaseAsset).toHaveBeenCalledWith("asset-1");
    expect(onInspectBaseAsset).toHaveBeenCalledWith("asset-1");
  });
});
