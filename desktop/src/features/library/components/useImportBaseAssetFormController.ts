import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { pickBaseAssetPath } from "../../../api/baseAssets";
import { useT } from "../../../i18n/I18nContext";
import type { BaseAssetCategoryOption } from "../../../types/baseAsset";
import type { BaseAssetSourceKind, ImportBaseAssetInput } from "../../../types/library";
import {
  buildImportBaseAssetPayload,
  buildImportBaseAssetResetState,
  formatImportBaseAssetPickerError,
  normalizeImportBaseAssetPickerLabel,
  resolveImportBaseAssetFallbackCategoryId,
  resolveImportBaseAssetSourceModes,
  resolveValidImportBaseAssetCategoryId,
  validateImportBaseAssetForm,
} from "./importBaseAssetFormRuntime";

interface UseImportBaseAssetFormControllerInput {
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultCategoryId?: string;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
}

export function useImportBaseAssetFormController({
  baseAssetCategories,
  defaultCategoryId,
  onImportBaseAsset,
}: UseImportBaseAssetFormControllerInput) {
  const t = useT();
  const sourceModes = resolveImportBaseAssetSourceModes(t);
  const fallbackCategoryId = resolveImportBaseAssetFallbackCategoryId(
    baseAssetCategories,
    defaultCategoryId,
  );

  const [sourceKind, setSourceKind] = useState<BaseAssetSourceKind>("directory");
  const [sourcePath, setSourcePath] = useState("");
  const [label, setLabel] = useState("");
  const [categoryId, setCategoryId] = useState(fallbackCategoryId);
  const [reusable, setReusable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  useEffect(() => {
    setCategoryId((current) =>
      resolveValidImportBaseAssetCategoryId({
        categoryId: current,
        categories: baseAssetCategories,
        defaultCategoryId,
      }),
    );
  }, [baseAssetCategories, defaultCategoryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateImportBaseAssetForm({
      sourcePath,
      categoryId,
      t,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const imported = await onImportBaseAsset(
      buildImportBaseAssetPayload({
        sourceKind,
        sourcePath,
        label,
        categoryId,
        reusable,
        fallbackLabel: t.library.forms.baseAsset.fallbackLabel,
      }),
    );

    if (imported) {
      const resetState = buildImportBaseAssetResetState(fallbackCategoryId);
      setSourcePath(resetState.sourcePath);
      setLabel(resetState.label);
      setReusable(resetState.reusable);
      setCategoryId(resetState.categoryId);
    }
  }

  async function handleBrowse(): Promise<void> {
    setPickerBusy(true);
    setError(null);

    try {
      const pickedPath = await pickBaseAssetPath(sourceKind, sourcePath);
      if (!pickedPath) {
        return;
      }

      setSourcePath(pickedPath);
      setLabel((current) =>
        normalizeImportBaseAssetPickerLabel({
          currentLabel: current,
          pickedPath,
          fallbackLabel: t.library.forms.baseAsset.fallbackLabel,
        }),
      );
    } catch (nextError) {
      setError(formatImportBaseAssetPickerError(nextError, t.library.forms.baseAsset.pickerFailed));
    } finally {
      setPickerBusy(false);
    }
  }

  return {
    t,
    sourceModes,
    sourceKind,
    setSourceKind,
    sourcePath,
    setSourcePath,
    label,
    setLabel,
    categoryId,
    setCategoryId,
    reusable,
    setReusable,
    error,
    pickerBusy,
    handleSubmit,
    handleBrowse,
    selectedCategory: baseAssetCategories.find((category) => category.id === categoryId) ?? null,
  };
}
