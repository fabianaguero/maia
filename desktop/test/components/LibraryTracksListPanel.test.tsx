import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { LibraryTracksListPanel } from "../../src/features/library/components/LibraryTracksListPanel";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("LibraryTracksListPanel", () => {
  it("routes select, relink, inspect, analyze, and delete actions for tracks", () => {
    const onDeleteTrack = vi.fn();
    const onInspectTrack = vi.fn();
    const onReanalyzeTrack = vi.fn();
    const onRelinkTrack = vi.fn();
    const onSelectTrack = vi.fn();

    renderWithI18n(
      <LibraryTracksListPanel
        newlyImportedId="track-2"
        selectedTrackId="track-1"
        tracks={[
          {
            id: "track-1",
            analysis: {
              bpm: 126,
              durationSeconds: 181,
              importedAt: "2026-06-28T10:00:00.000Z",
            },
            file: {
              availabilityState: "available",
              fileExtension: "wav",
            },
            tags: {
              title: "Night shift",
              artist: "Maia",
              musicStyleLabel: "House",
            },
          } as never,
          {
            id: "track-2",
            analysis: {
              bpm: null,
              durationSeconds: 95,
              importedAt: "2026-06-28T11:00:00.000Z",
            },
            file: {
              availabilityState: "missing",
              fileExtension: "mp3",
            },
            tags: {
              title: "Alert lane",
              artist: "Maia",
              musicStyleLabel: "Techno",
            },
          } as never,
        ]}
        onDeleteTrack={onDeleteTrack}
        onInspectTrack={onInspectTrack}
        onReanalyzeTrack={onReanalyzeTrack}
        onRelinkTrack={onRelinkTrack}
        onSelectTrack={onSelectTrack}
      />,
    );

    fireEvent.click(screen.getByText("Night shift"));
    expect(onSelectTrack).toHaveBeenCalledWith("track-1");

    fireEvent.click(screen.getByRole("button", { name: en.library.view }));
    expect(onInspectTrack).toHaveBeenCalledWith("track-1");

    fireEvent.click(screen.getByRole("button", { name: en.library.relink }));
    expect(onRelinkTrack).toHaveBeenCalledWith("track-2");

    fireEvent.click(screen.getByRole("button", { name: en.library.analyze }));
    expect(onReanalyzeTrack).toHaveBeenCalledWith("track-2");

    fireEvent.click(screen.getAllByRole("button", { name: en.library.deleteTrack })[0]);
    expect(onDeleteTrack).toHaveBeenCalledWith("track-1");
  });
});
