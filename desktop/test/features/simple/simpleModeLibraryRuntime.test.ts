import { describe, expect, it } from "vitest";

import {
  buildSimpleModeImportRepositoryInput,
  resolveSimpleModeRepositorySourceKind,
  shouldShowSimpleModeStartButton,
} from "../../../src/features/simple/simpleModeLibraryRuntime";

describe("simpleModeLibraryRuntime", () => {
  it("builds import requests from entered paths", () => {
    expect(resolveSimpleModeRepositorySourceKind("/logs/app.log")).toBe("file");
    expect(resolveSimpleModeRepositorySourceKind("/logs/folder")).toBe("directory");
    expect(
      buildSimpleModeImportRepositoryInput("/logs/app.log", "fallback"),
    ).toEqual({
      label: "app.log",
      sourcePath: "/logs/app.log",
      sourceKind: "file",
    });
  });

  it("shows the monitoring action only for the selected repository with assets", () => {
    expect(shouldShowSimpleModeStartButton("repo-1", "repo-1", 1)).toBe(true);
    expect(shouldShowSimpleModeStartButton("repo-1", "repo-2", 1)).toBe(false);
    expect(shouldShowSimpleModeStartButton("repo-1", "repo-1", 0)).toBe(false);
  });
});
