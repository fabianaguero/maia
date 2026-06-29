import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { TracksTable } from "../../../src/features/library/components/TracksTable";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("TracksTable", () => {
  it("renders selected and missing tracks, supports reanalyze, and keeps action clicks from selecting rows", () => {
    const onSelectTrack = vi.fn();
    const onInspectTrack = vi.fn();
    const onReanalyze = vi.fn(async () => true);

    const { container } = renderWithI18n(
      <TracksTable
        tracks={[
          {
            id: "track-1",
            sourcePath: "/music/night-drive.wav",
            file: {
              sourcePath: "/music/night-drive.wav",
              storagePath: "/music/night-drive.wav",
              fileExtension: "wav",
              availabilityState: "available",
              playbackSource: "source_file",
            },
            tags: {
              title: "Night Drive",
              musicStyleLabel: "House",
            },
            analysis: {
              bpm: 126.4,
              bpmConfidence: 0.87,
              repoSuggestedBpm: 125,
              analyzerStatus: "ready",
              importedAt: "2026-06-29T10:00:00.000Z",
            },
          } as never,
          {
            id: "track-2",
            sourcePath: "/music/lost-alert.mp3",
            file: {
              sourcePath: "/music/lost-alert.mp3",
              storagePath: "/music/lost-alert.mp3",
              fileExtension: "mp3",
              availabilityState: "missing",
              playbackSource: "source_file",
            },
            tags: {
              title: "Lost Alert",
              musicStyleLabel: "Techno",
            },
            analysis: {
              bpm: null,
              bpmConfidence: 0.23,
              repoSuggestedBpm: null,
              analyzerStatus: "pending",
              importedAt: "2026-06-29T11:00:00.000Z",
            },
          } as never,
        ]}
        selectedTrackId="track-1"
        onSelectTrack={onSelectTrack}
        onInspectTrack={onInspectTrack}
        onReanalyze={onReanalyze}
      />,
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0]?.className).toContain("selected");
    expect(rows[1]?.className).toContain("track-missing");
    expect(rows[1]?.textContent).toContain("LOST");
    expect(screen.getAllByText(en.library.tables.tracks.pending).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Night Drive"));
    expect(onSelectTrack).toHaveBeenCalledWith("track-1");

    fireEvent.click(screen.getAllByRole("button", { name: en.library.tables.tracks.open })[0]!);
    fireEvent.click(screen.getByRole("button", { name: en.library.tables.tracks.reanalyze }));

    expect(onInspectTrack).toHaveBeenCalledWith("track-1");
    expect(onReanalyze).toHaveBeenCalledWith("track-2");
    expect(onSelectTrack).toHaveBeenCalledTimes(1);
  });
});
