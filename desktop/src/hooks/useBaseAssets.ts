import { startTransition, useEffect, useState } from "react";

import { importBaseAsset, listBaseAssets } from "../api/baseAssets";
import type { BaseAssetRecord, ImportBaseAssetInput } from "../types/library";

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

function sortBaseAssets(baseAssets: BaseAssetRecord[]): BaseAssetRecord[] {
  return [...baseAssets].sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

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
          const sorted = sortBaseAssets(nextBaseAssets);
          setBaseAssets(sorted);
          setSelectedBaseAssetId((current) => {
            if (current && sorted.some((baseAsset) => baseAsset.id === current)) {
              return current;
            }

            return sorted[0]?.id ?? null;
          });
          setError(null);
          setLoading(false);
        });
      } catch (nextError) {
        if (!active) {
          return;
        }
  
        startTransition(() => {
          setError(toMessage(nextError, "Unexpected base asset failure."));
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
        setBaseAssets((current) =>
          sortBaseAssets([
            nextBaseAsset,
            ...current.filter((baseAsset) => baseAsset.id !== nextBaseAsset.id),
          ]),
        );
        setSelectedBaseAssetId(nextBaseAsset.id);
        setError(null);
      });

      return nextBaseAsset;
    } catch (nextError) {
      startTransition(() => {
        setError(toMessage(nextError, "Unexpected base asset failure."));
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
