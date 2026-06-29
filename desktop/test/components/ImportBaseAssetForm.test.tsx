import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportBaseAssetForm } from "../../src/features/library/components/ImportBaseAssetForm";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

const pickBaseAssetPath = vi.fn();

vi.mock("../../src/api/baseAssets", () => ({
  pickBaseAssetPath: (...args: unknown[]) => pickBaseAssetPath(...args),
}));

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ImportBaseAssetForm", () => {
  it("validates required path and category before importing", async () => {
    const onImportBaseAsset = vi.fn(async () => true);

    renderWithI18n(
      <ImportBaseAssetForm
        busy={false}
        baseAssetCategories={[]}
        onImportBaseAsset={onImportBaseAsset}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`^${en.library.forms.baseAsset.registerBaseAsset}\\b`),
      }),
    );

    expect(
      await screen.findByText(en.library.forms.baseAsset.pathRequiredError),
    ).toBeInTheDocument();
    expect(onImportBaseAsset).not.toHaveBeenCalled();

    fireEvent.change(
      screen.getByPlaceholderText(en.library.forms.baseAsset.folderPathPlaceholder),
      { target: { value: "/packs/drums" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`^${en.library.forms.baseAsset.registerBaseAsset}\\b`),
      }),
    );

    expect(
      await screen.findByText(en.library.forms.baseAsset.categoryRequiredError),
    ).toBeInTheDocument();
    expect(onImportBaseAsset).not.toHaveBeenCalled();
  });

  it("browses, derives labels, imports, and resets on success", async () => {
    pickBaseAssetPath.mockResolvedValueOnce("/packs/snare.wav");
    const onImportBaseAsset = vi.fn(async () => true);

    renderWithI18n(
      <ImportBaseAssetForm
        busy={false}
        baseAssetCategories={[
          { id: "reactive", label: "Reactive", description: "Reactive samples" },
        ]}
        defaultCategoryId="reactive"
        onImportBaseAsset={onImportBaseAsset}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`^${en.library.forms.baseAsset.singleFile}\\b`),
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(en.library.forms.baseAsset.browseFile, "i") }),
    );

    await waitFor(() => {
      expect(pickBaseAssetPath).toHaveBeenCalledWith("file", "");
    });

    const pathInput = screen.getByPlaceholderText(
      en.library.forms.baseAsset.filePathPlaceholder,
    ) as HTMLInputElement;
    const labelInput = screen.getByPlaceholderText(
      en.library.forms.baseAsset.displayLabelPlaceholder,
    ) as HTMLInputElement;
    const reusableInput = screen.getByRole("checkbox") as HTMLInputElement;

    await waitFor(() => {
      expect(pathInput.value).toBe("/packs/snare.wav");
      expect(labelInput.value).toBe("snare.wav");
    });

    fireEvent.click(reusableInput);
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`^${en.library.forms.baseAsset.registerBaseAsset}\\b`),
      }),
    );

    await waitFor(() => {
      expect(onImportBaseAsset).toHaveBeenCalledWith({
        sourceKind: "file",
        sourcePath: "/packs/snare.wav",
        label: "snare.wav",
        categoryId: "reactive",
        reusable: false,
      });
    });

    expect(pathInput.value).toBe("");
    expect(labelInput.value).toBe("");
    expect(reusableInput.checked).toBe(true);
  });

  it("shows picker failures", async () => {
    pickBaseAssetPath.mockRejectedValueOnce(new Error("picker exploded"));

    renderWithI18n(
      <ImportBaseAssetForm
        busy={false}
        baseAssetCategories={[
          { id: "reactive", label: "Reactive", description: "Reactive samples" },
        ]}
        onImportBaseAsset={vi.fn(async () => true)}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(en.library.forms.baseAsset.browseFolder, "i"),
      }),
    );

    expect(await screen.findByText("picker exploded")).toBeInTheDocument();
  });
});
