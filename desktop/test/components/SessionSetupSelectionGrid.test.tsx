import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { SessionSetupSelectionGrid } from "../../src/features/session/SessionSetupSelectionGrid";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

afterEach(() => {
  cleanup();
});

function createProps() {
  return {
    tracks: [
      {
        id: "track-1",
        tags: { title: "Night shift", artist: "Maia" },
        analysis: { bpm: 126 },
      } as never,
    ],
    playlists: [
      {
        id: "playlist-1",
        name: "Night watch",
        trackIds: ["track-1"],
        createdAt: "2026-06-28T10:00:00.000Z",
        updatedAt: "2026-06-28T10:10:00.000Z",
      } as never,
    ],
    sourceOptions: [
      {
        id: "repo-1",
        title: "customers-service",
        sourcePath: "/logs/customers-service.log",
      } as never,
    ],
    mode: "log" as const,
    baseMode: "track" as const,
    selectedSourceId: null,
    selectedTrackId: null,
    selectedPlaylistId: null,
    selectedSource: null,
    selectedTrack: null,
    selectedPlaylist: null,
    selectedBaseLabel: null,
    selectedBaseDetail: null,
    onBaseModeChange: vi.fn(),
    onTrackSelect: vi.fn(),
    onPlaylistSelect: vi.fn(),
    onModeChange: vi.fn(),
    onSourceSelect: vi.fn(),
  };
}

describe("SessionSetupSelectionGrid", () => {
  it("renders placeholders and disables unavailable base-mode tabs", () => {
    renderWithI18n(
      <SessionSetupSelectionGrid
        {...createProps()}
        tracks={[]}
        playlists={[]}
        sourceOptions={[]}
      />,
    );

    expect(screen.getByRole("button", { name: en.session.track })).toBeDisabled();
    expect(screen.getByRole("button", { name: en.session.playlist })).toBeDisabled();
    expect(screen.getByText(en.session.noTracks)).toBeInTheDocument();
    expect(screen.getByText(en.session.noImportedLogs)).toBeInTheDocument();
  });

  it("renders playlist and repository empty states when those modes are active", () => {
    renderWithI18n(
      <SessionSetupSelectionGrid
        {...createProps()}
        tracks={[
          {
            id: "track-1",
            tags: { title: "Night shift" },
            analysis: { bpm: 126 },
          } as never,
        ]}
        playlists={[]}
        sourceOptions={[]}
        baseMode="playlist"
        mode="repo"
      />,
    );

    expect(screen.getByText(en.session.noPlaylists)).toBeInTheDocument();
    expect(screen.getByText(en.session.noImportedRepos)).toBeInTheDocument();
  });

  it("routes playlist selection through callbacks and shows playlist summary", () => {
    const props = createProps();

    const view = renderWithI18n(
      <SessionSetupSelectionGrid
        {...props}
        baseMode="playlist"
        selectedPlaylistId="playlist-1"
        selectedPlaylist={props.playlists[0]}
        selectedBaseLabel="Night watch"
        selectedBaseDetail="1 sounds · Median 126 BPM"
      />,
    );

    fireEvent.click(view.getByRole("button", { name: /night watch/i }));
    expect(props.onPlaylistSelect).toHaveBeenCalledWith("playlist-1");

    expect(view.getAllByText(en.session.armed).length).toBeGreaterThan(0);
    expect(view.getAllByText("Night watch").length).toBeGreaterThan(0);
    expect(view.getAllByText(/median 126 bpm/i).length).toBeGreaterThan(0);
  });

  it("routes base/source selections and mode switches through callbacks", () => {
    const props = createProps();

    const view = renderWithI18n(
      <SessionSetupSelectionGrid
        {...props}
        selectedTrack={{
          id: "track-1",
          tags: { title: "Night shift" },
          analysis: { bpm: 126 },
        } as never}
        selectedSource={{
          id: "repo-1",
          title: "customers-service",
          sourcePath: "/logs/customers-service.log",
        } as never}
        selectedBaseLabel="Night shift"
        selectedBaseDetail="126 BPM"
      />,
    );

    fireEvent.click(view.getAllByRole("button", { name: en.session.playlist }).at(-1)!);
    expect(props.onBaseModeChange).toHaveBeenCalledWith("playlist");

    fireEvent.click(view.getByRole("button", { name: /night shift/i }));
    expect(props.onTrackSelect).toHaveBeenCalledWith("track-1");

    fireEvent.click(view.getAllByRole("button", { name: en.session.repository }).at(-1)!);
    expect(props.onModeChange).toHaveBeenCalledWith("repo");

    fireEvent.click(view.getAllByRole("button", { name: /customers-service/i }).at(-1)!);
    expect(props.onSourceSelect).toHaveBeenCalledWith("repo-1");

    expect(view.getAllByText(en.session.armed).length).toBeGreaterThan(0);
    expect(view.getAllByText("Night shift").length).toBeGreaterThan(0);
    expect(view.getAllByText("126 BPM").length).toBeGreaterThan(0);
    expect(view.getByText(en.session.selected)).toBeInTheDocument();
  });
});
