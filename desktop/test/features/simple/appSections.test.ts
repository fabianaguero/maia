import { describe, expect, it } from "vitest";

import { APP_SECTIONS, type AppSection } from "../../../src/features/simple/appSections";

describe("appSections", () => {
  it("exports the supported simple app sections in a stable order", () => {
    const sections: AppSection[] = [...APP_SECTIONS];

    expect(sections).toEqual(["monitor", "library", "inspect", "compose", "connections", "codeProjects", "setup"]);
  });
});
