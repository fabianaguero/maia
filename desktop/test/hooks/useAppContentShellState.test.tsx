import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAppContentShellState } from "../../src/hooks/useAppContentShellState";

describe("useAppContentShellState", () => {
  it("manages shell state and toggles the document skin class", () => {
    document.documentElement.classList.remove("light-mode");

    const { result } = renderHook(() => useAppContentShellState());

    expect(result.current.screen).toBe("library");
    expect(result.current.pillar).toBe("curate");
    expect(result.current.libraryTab).toBe("tracks");
    expect(result.current.analysisMode).toBe("track");
    expect(result.current.lang).toBe("en");
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("light-mode")).toBe(false);

    act(() => {
      result.current.setScreen("inspect");
      result.current.setPillar("perform");
      result.current.setLibraryTab("connections");
      result.current.setAnalysisMode("repo");
      result.current.setLang("es");
      result.current.setIsDark(false);
      result.current.setNewlyImportedId("track-1");
    });

    expect(result.current.screen).toBe("inspect");
    expect(result.current.pillar).toBe("perform");
    expect(result.current.libraryTab).toBe("connections");
    expect(result.current.analysisMode).toBe("repo");
    expect(result.current.lang).toBe("es");
    expect(result.current.newlyImportedId).toBe("track-1");
    expect(document.documentElement.classList.contains("light-mode")).toBe(true);
  });
});
