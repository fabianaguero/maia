import { describe, expect, it } from "vitest";

import {
  baseAssetCategoryCatalog,
  fallbackBaseAssetCategoryLabel,
  resolveBaseAssetCategory,
} from "../../src/config/baseAssetCategories";

describe("baseAssetCategories", () => {
  it("loads a normalized catalog with a valid default category", () => {
    expect(baseAssetCategoryCatalog.baseAssetCategories.length).toBeGreaterThan(0);
    expect(
      baseAssetCategoryCatalog.baseAssetCategories.some(
        (category) => category.id === baseAssetCategoryCatalog.defaultBaseAssetCategoryId,
      ),
    ).toBe(true);

    for (const category of baseAssetCategoryCatalog.baseAssetCategories) {
      expect(category.id).toBe(category.id.trim());
      expect(category.label).toBe(category.label.trim());
      expect(category.description).toBe(category.description.trim());
      expect(category.id.length).toBeGreaterThan(0);
      expect(category.label.length).toBeGreaterThan(0);
      expect(category.description.length).toBeGreaterThan(0);
    }
  });

  it("resolves known categories and falls back cleanly for unknown values", () => {
    const knownId = baseAssetCategoryCatalog.defaultBaseAssetCategoryId;
    const known = resolveBaseAssetCategory(knownId);

    expect(known?.id).toBe(knownId);
    expect(resolveBaseAssetCategory(null)).toBeNull();
    expect(resolveBaseAssetCategory("missing-category")).toBeNull();
    expect(fallbackBaseAssetCategoryLabel(knownId)).toBe(known?.label);
    expect(fallbackBaseAssetCategoryLabel(" custom-id ")).toBe(" custom-id ");
    expect(fallbackBaseAssetCategoryLabel("")).toBe("Not set");
    expect(fallbackBaseAssetCategoryLabel(undefined)).toBe("Not set");
  });
});
