import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildImportBaseAssetPayload,
  buildImportBaseAssetResetState,
  deriveImportBaseAssetLabel,
  formatImportBaseAssetPickerError,
  normalizeImportBaseAssetPickerLabel,
  resolveImportBaseAssetFallbackCategoryId,
  resolveImportBaseAssetSourceModes,
  resolveValidImportBaseAssetCategoryId,
  validateImportBaseAssetForm,
} from "../../src/features/library/components/importBaseAssetFormRuntime";

describe("importBaseAssetFormRuntime", () => {
  it("derives source modes and fallback category ids", () => {
    expect(resolveImportBaseAssetSourceModes(en)).toHaveLength(2);
    expect(
      resolveImportBaseAssetFallbackCategoryId(
        [{ id: "reactive", label: "Reactive", description: "desc" }],
        undefined,
      ),
    ).toBe("reactive");
    expect(
      resolveValidImportBaseAssetCategoryId({
        categoryId: "missing",
        categories: [{ id: "reactive", label: "Reactive", description: "desc" }],
      }),
    ).toBe("reactive");
  });

  it("validates path/category and builds normalized payloads", () => {
    expect(
      validateImportBaseAssetForm({
        sourcePath: "",
        categoryId: "",
        t: en,
      }),
    ).toBe(en.library.forms.baseAsset.pathRequiredError);

    expect(
      validateImportBaseAssetForm({
        sourcePath: "/packs/kick.wav",
        categoryId: "",
        t: en,
      }),
    ).toBe(en.library.forms.baseAsset.categoryRequiredError);

    expect(
      buildImportBaseAssetPayload({
        sourceKind: "file",
        sourcePath: " /packs/kick.wav ",
        label: " ",
        categoryId: " drums ",
        reusable: true,
        fallbackLabel: en.library.forms.baseAsset.fallbackLabel,
      }),
    ).toEqual({
      sourceKind: "file",
      sourcePath: "/packs/kick.wav",
      label: "kick.wav",
      categoryId: "drums",
      reusable: true,
    });
  });

  it("normalizes labels, picker errors, and reset state", () => {
    expect(deriveImportBaseAssetLabel("/packs/fx/riser.wav", "Base asset")).toBe("riser.wav");
    expect(
      normalizeImportBaseAssetPickerLabel({
        currentLabel: "",
        pickedPath: "/packs/fx/riser.wav",
        fallbackLabel: "Base asset",
      }),
    ).toBe("riser.wav");
    expect(
      normalizeImportBaseAssetPickerLabel({
        currentLabel: "Custom label",
        pickedPath: "/packs/fx/riser.wav",
        fallbackLabel: "Base asset",
      }),
    ).toBe("Custom label");
    expect(formatImportBaseAssetPickerError(new Error("picker exploded"), "fallback")).toBe(
      "picker exploded",
    );
    expect(formatImportBaseAssetPickerError("unknown", "fallback")).toBe("fallback");
    expect(buildImportBaseAssetResetState("reactive")).toEqual({
      sourcePath: "",
      label: "",
      reusable: true,
      categoryId: "reactive",
    });
  });
});
