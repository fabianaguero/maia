import { describe, expect, it } from "vitest";

import { en } from "../src/i18n/en";
import { resolveAppUIContentLabel } from "../src/appUIRuntime";

describe("appUIRuntime", () => {
  it("resolves monitor and library labels by mode", () => {
    expect(resolveAppUIContentLabel("monitor", "simple", en)).toBe(en.simpleMode.nav.monitor);
    expect(resolveAppUIContentLabel("monitor", "expert", en)).toBe(en.nav.session.label);
    expect(resolveAppUIContentLabel("library", "simple", en)).toBe(en.simpleMode.nav.files);
    expect(resolveAppUIContentLabel("library", "expert", en)).toBe(en.nav.library.label);
  });

  it("falls back to the generic coming soon label", () => {
    expect(resolveAppUIContentLabel("connections", "simple", en)).toBe(
      en.simpleMode.common.comingSoon,
    );
  });
});
