import { startTransition, useEffect, useState } from "react";

import { importBaseAsset, listBaseAssets } from "../api/baseAssets";
import type { BaseAssetRecord, ImportBaseAssetInput } from "../types/library";
import {
  appendImportedBaseAsset,
  resolveSelectedBaseAssetId,
  sortBaseAssetsByImportedAt,
  toBaseAssetErrorMessage,
} from "./baseAssetsRuntime";

export function useBaseAssets() {
  const [baseAssets, setBaseAssets] = useState<BaseAssetRecord[]>([]);
  const [selectedBaseAssetId, setSelectedBaseAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const nextBaseAssets = await listBaseAssets();

        if (!active) {
          return;
        }

        startTransition(() => {
          const sorted = sortBaseAssetsByImportedAt(nextBaseAssets);
          setBaseAssets(sorted);
          setSelectedBaseAssetId((current) => resolveSelectedBaseAssetId(current, sorted));
          setError(null);
          setLoading(false);
        });
      } catch (nextError) {
        if (!active) {
          return;
        }

        startTransition(() => {
          setError(toBaseAssetErrorMessage(nextError));
          setLoading(false);
        });
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function importLibraryBaseAsset(
    input: ImportBaseAssetInput,
  ): Promise<BaseAssetRecord | null> {
    setMutating(true);

    try {
      const nextBaseAsset = await importBaseAsset(input);

      startTransition(() => {
        setBaseAssets((current) => appendImportedBaseAsset(current, nextBaseAsset));
        setSelectedBaseAssetId(nextBaseAsset.id);
        setError(null);
      });

      return nextBaseAsset;
    } catch (nextError) {
      startTransition(() => {
        setError(toBaseAssetErrorMessage(nextError));
      });
      return null;
    } finally {
      setMutating(false);
    }
  }

  const selectedBaseAsset =
    baseAssets.find((baseAsset) => baseAsset.id === selectedBaseAssetId) ?? null;

  return {
    baseAssets,
    selectedBaseAsset,
    selectedBaseAssetId,
    setSelectedBaseAssetId,
    loading,
    mutating,
    error,
    importLibraryBaseAsset,
  };
}
