import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportTrackForm } from "../../src/features/library/components/ImportTrackForm";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

const pickTrackSourcePath = vi.fn();

vi.mock("../../src/api/library", () => ({
  pickTrackSourcePath: (...args: unknown[]) => pickTrackSourcePath(...args),
}));

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ImportTrackForm", () => {
  it("validates required fields and exposes demo loading", async () => {
    const onImportTrack = vi.fn(async () => true);
    const onSeedDemo = vi.fn(async () => undefined);

    renderWithI18n(
      <ImportTrackForm
        busy={false}
        musicStyles={[]}
        onImportTrack={onImportTrack}
        onSeedDemo={onSeedDemo}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: en.library.forms.track.importTrack }));
    expect(await screen.findByText(en.library.forms.track.pathRequiredError)).toBeInTheDocument();
    expect(onImportTrack).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: en.library.forms.track.loadDemoTracks }));
    expect(onSeedDemo).toHaveBeenCalledTimes(1);
  });

  it("browses, derives title, imports, and resets on success", async () => {
    pickTrackSourcePath.mockResolvedValueOnce("/music/Daft Punk - Around The World.mp3");
    const onImportTrack = vi.fn(async () => true);

    renderWithI18n(
      <ImportTrackForm
        busy={false}
        musicStyles={[
          {
            id: "house",
            label: "House",
            description: "Club-focused groove",
            minBpm: 122,
            maxBpm: 128,
          },
        ]}
        defaultMusicStyleId="house"
        onImportTrack={onImportTrack}
        onSeedDemo={vi.fn(async () => undefined)}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(en.library.forms.track.browseAudioFile, "i") }),
    );

    await waitFor(() => {
      expect(pickTrackSourcePath).toHaveBeenCalledWith("");
    });

    const titleInput = screen.getByPlaceholderText(
      en.library.forms.track.trackTitlePlaceholder,
    ) as HTMLInputElement;
    const pathInput = screen.getByPlaceholderText(
      en.library.forms.track.localPathPlaceholder,
    ) as HTMLInputElement;

    await waitFor(() => {
      expect(titleInput.value).toBe("Daft Punk - Around The World");
      expect(pathInput.value).toBe("/music/Daft Punk - Around The World.mp3");
    });

    fireEvent.click(screen.getByRole("button", { name: en.library.forms.track.importTrack }));

    await waitFor(() => {
      expect(onImportTrack).toHaveBeenCalledWith({
        title: "Daft Punk - Around The World",
        sourcePath: "/music/Daft Punk - Around The World.mp3",
        musicStyleId: "house",
      });
    });

    expect(titleInput.value).toBe("");
    expect(pathInput.value).toBe("");
  });

  it("shows browse failures", async () => {
    pickTrackSourcePath.mockRejectedValueOnce(new Error("no picker"));

    renderWithI18n(
      <ImportTrackForm
        busy={false}
        musicStyles={[
          {
            id: "house",
            label: "House",
            description: "Club-focused groove",
            minBpm: 122,
            maxBpm: 128,
          },
        ]}
        onImportTrack={vi.fn(async () => true)}
        onSeedDemo={vi.fn(async () => undefined)}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(en.library.forms.track.browseAudioFile, "i") }),
    );

    expect(await screen.findByText("no picker")).toBeInTheDocument();
  });
});
