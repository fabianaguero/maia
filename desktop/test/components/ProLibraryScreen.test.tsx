import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { ProLibraryScreen } from "../../src/features/simple/ProLibraryScreen";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("ProLibraryScreen", () => {
  it("switches between sounds, sources, and profiles while rendering deck data", () => {
    renderWithI18n(
      <ProLibraryScreen
        tracks={[
          {
            id: "track-1",
            analysis: { bpm: 126 },
            file: {
              sourcePath: "/music/track-1.wav",
              fileExtension: "wav",
            },
            tags: {
              title: "Night drive",
              artist: "Maia",
              musicStyleLabel: "House",
            },
          } as never,
        ]}
        repositories={[
          {
            id: "repo-1",
            title: "visits-service",
            sourceKind: "file",
            sourcePath: "/logs/visits-service.log",
            importedAt: "2026-06-28T17:00:00.000Z",
            suggestedBpm: 124,
          } as never,
        ]}
        baseAssets={[
          {
            id: "base-1",
          } as never,
        ]}
      />,
    );

    expect(screen.getByText("Night drive")).toBeInTheDocument();
    expect(screen.getByText("126 BPM")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /log sources/i }));

    expect(screen.getByText("visits-service")).toBeInTheDocument();
    expect(screen.getByText("/logs/visits-service.log")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /profiles/i }));

    expect(screen.getByText(en.library.noBasePacksYet)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import base asset/i })).toBeInTheDocument();
  });
});
