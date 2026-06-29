import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { RepositoriesTable } from "../../../src/features/library/components/RepositoriesTable";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("RepositoriesTable", () => {
  it("renders repository rows, maps source kinds, and routes inspect/reanalyze actions", () => {
    const onSelectRepository = vi.fn();
    const onInspectRepository = vi.fn();
    const onReanalyze = vi.fn(async () => true);

    const { container } = renderWithI18n(
      <RepositoriesTable
        repositories={[
          {
            id: "repo-1",
            title: "maia-core",
            sourceKind: "directory",
            sourcePath: "/repos/maia-core",
            suggestedBpm: 126,
            confidence: 0.81,
            buildSystem: "pnpm",
            primaryLanguage: "TypeScript",
            analyzerStatus: "ready",
            importedAt: "2026-06-29T10:00:00.000Z",
          } as never,
          {
            id: "repo-2",
            title: "ops-log",
            sourceKind: "file",
            sourcePath: "/logs/ops.log",
            suggestedBpm: null,
            confidence: 0.24,
            buildSystem: "tail",
            primaryLanguage: "Logs",
            analyzerStatus: "pending",
            importedAt: "2026-06-29T11:00:00.000Z",
          } as never,
          {
            id: "repo-3",
            title: "upstream",
            sourceKind: "url",
            sourcePath: "https://github.com/open-source/maia",
            suggestedBpm: 124,
            confidence: 0.52,
            buildSystem: "github",
            primaryLanguage: "Mixed",
            analyzerStatus: "ready",
            importedAt: "2026-06-29T11:30:00.000Z",
          } as never,
        ]}
        selectedRepositoryId="repo-1"
        onSelectRepository={onSelectRepository}
        onInspectRepository={onInspectRepository}
        onReanalyze={onReanalyze}
      />,
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0]?.className).toContain("selected");
    expect(container.textContent).toContain(en.inspect.filesystem);
    expect(container.textContent).toContain(en.library.logFile);
    expect(container.textContent).toContain(en.library.githubUrl);
    expect(screen.getAllByText(en.library.tables.repositories.pending).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("maia-core"));
    fireEvent.click(screen.getAllByRole("button", { name: en.library.tables.repositories.open })[0]!);
    fireEvent.click(screen.getByRole("button", { name: en.library.tables.repositories.reanalyze }));

    expect(onSelectRepository).toHaveBeenCalledWith("repo-1");
    expect(onInspectRepository).toHaveBeenCalledWith("repo-1");
    expect(onReanalyze).toHaveBeenCalledWith("repo-2");
    expect(onSelectRepository).toHaveBeenCalledTimes(1);
  });
});
