import { describe, expect, it } from "vitest";

import { resolveAppV0PreferencesPersistenceTarget } from "../../src/hooks/appV0PreferencesPersistenceRuntime";

describe("appV0PreferencesPersistenceRuntime", () => {
  it("resolves storage and root element when browser globals are available", () => {
    const storage = {
      setItem() {},
    };
    const rootElement = {
      setAttribute() {},
    };

    expect(
      resolveAppV0PreferencesPersistenceTarget(
        { localStorage: storage },
        { documentElement: rootElement },
      ),
    ).toEqual({
      storage,
      rootElement,
    });
  });

  it("falls back to null handles when browser globals are unavailable", () => {
    expect(resolveAppV0PreferencesPersistenceTarget(undefined, undefined)).toEqual({
      storage: null,
      rootElement: null,
    });

    expect(
      resolveAppV0PreferencesPersistenceTarget({ localStorage: null }, { documentElement: null }),
    ).toEqual({
      storage: null,
      rootElement: null,
    });
  });
});
