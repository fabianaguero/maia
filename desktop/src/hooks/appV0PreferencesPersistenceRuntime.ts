interface StorageLike {
  getItem?(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface RootElementLike {
  setAttribute(name: string, value: string): void;
}

interface DocumentLike {
  documentElement?: RootElementLike | null;
}

interface WindowLike {
  localStorage?: StorageLike | null;
}

export interface AppV0PreferencesPersistenceTarget {
  storage: StorageLike | null;
  rootElement: RootElementLike | null;
}

export function resolveAppV0PreferencesPersistenceTarget(
  currentWindow: WindowLike | null | undefined,
  currentDocument: DocumentLike | null | undefined,
): AppV0PreferencesPersistenceTarget {
  return {
    storage: currentWindow?.localStorage ?? null,
    rootElement: currentDocument?.documentElement ?? null,
  };
}
