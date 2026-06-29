import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { LibrarySourcesListPanel } from "../../src/features/library/components/LibrarySourcesListPanel";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("LibrarySourcesListPanel", () => {
  it("selects a source and routes inspect or analyze actions based on BPM availability", () => {
    const onDeleteRepository = vi.fn();
    const onInspectRepository = vi.fn();
    const onReanalyzeRepository = vi.fn();
    const onSelectRepository = vi.fn();

    renderWithI18n(
      <LibrarySourcesListPanel
        newlyImportedId="repo-2"
        repositories={[
          {
            id: "repo-1",
            title: "customers-service",
            sourceKind: "file",
            suggestedBpm: 124,
            primaryLanguage: "typescript",
            importedAt: "2026-06-28T10:00:00.000Z",
          } as never,
          {
            id: "repo-2",
            title: "visits-service",
            sourceKind: "directory",
            suggestedBpm: null,
            primaryLanguage: "python",
            importedAt: "2026-06-28T11:00:00.000Z",
          } as never,
        ]}
        selectedRepositoryId="repo-1"
        onDeleteRepository={onDeleteRepository}
        onInspectRepository={onInspectRepository}
        onReanalyzeRepository={onReanalyzeRepository}
        onSelectRepository={onSelectRepository}
      />,
    );

    fireEvent.click(screen.getByText("customers-service"));
    expect(onSelectRepository).toHaveBeenCalledWith("repo-1");

    fireEvent.click(screen.getByRole("button", { name: en.library.view }));
    expect(onInspectRepository).toHaveBeenCalledWith("repo-1");

    fireEvent.click(screen.getByRole("button", { name: en.library.analyze }));
    expect(onReanalyzeRepository).toHaveBeenCalledWith("repo-2");

    fireEvent.click(screen.getAllByRole("button", { name: en.library.deleteRepository })[0]);
    expect(onDeleteRepository).toHaveBeenCalledWith("repo-1");
  });
});
