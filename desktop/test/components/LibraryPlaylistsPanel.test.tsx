import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { LibraryPlaylistsPanel } from "../../src/features/library/components/LibraryPlaylistsPanel";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("LibraryPlaylistsPanel", () => {
  it("renders the editor and playlist cards with selection, edit, save, and delete actions", () => {
    const onDeletePlaylist = vi.fn();
    const onOpenPlaylistEditor = vi.fn();
    const onResetPlaylistEditor = vi.fn();
    const onSavePlaylist = vi.fn();
    const onSelectPlaylist = vi.fn();
    const onSetPlaylistName = vi.fn();
    const onTogglePlaylistTrack = vi.fn();

    renderWithI18n(
      <LibraryPlaylistsPanel
        playlistEditorId={null}
        playlistEditorOpen={true}
        playlistName="Night watch"
        playlistTrackIds={["track-1"]}
        playlists={[
          {
            id: "playlist-1",
            name: "Night watch",
            trackIds: ["track-1"],
            createdAt: "2026-06-28T12:00:00.000Z",
            updatedAt: "2026-06-28T12:30:00.000Z",
          } as never,
        ]}
        selectedPlaylistId="playlist-1"
        tracks={[
          {
            id: "track-1",
            analysis: {
              bpm: 126,
            },
            file: {
              availabilityState: "available",
            },
            tags: {
              title: "Night shift",
              artist: "Maia",
            },
          } as never,
          {
            id: "track-2",
            analysis: {
              bpm: null,
            },
            file: {
              availabilityState: "missing",
            },
            tags: {
              title: "Alert lane",
              artist: "Maia",
            },
          } as never,
        ]}
        onDeletePlaylist={onDeletePlaylist}
        onOpenPlaylistEditor={onOpenPlaylistEditor}
        onResetPlaylistEditor={onResetPlaylistEditor}
        onSavePlaylist={onSavePlaylist}
        onSelectPlaylist={onSelectPlaylist}
        onSetPlaylistName={onSetPlaylistName}
        onTogglePlaylistTrack={onTogglePlaylistTrack}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Night watch"), {
      target: { value: "Night watch v2" },
    });
    expect(onSetPlaylistName).toHaveBeenCalledWith("Night watch v2");

    fireEvent.click(screen.getByRole("checkbox", { name: /night shift/i }));
    expect(onTogglePlaylistTrack).toHaveBeenCalledWith("track-1");

    fireEvent.click(screen.getByRole("button", { name: en.library.savePlaylist }));
    expect(onSavePlaylist).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: en.library.cancel }));
    expect(onResetPlaylistEditor).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Night watch"));
    expect(onSelectPlaylist).toHaveBeenCalledWith("playlist-1");

    fireEvent.click(screen.getByRole("button", { name: en.library.edit }));
    expect(onOpenPlaylistEditor).toHaveBeenCalledWith(
      expect.objectContaining({ id: "playlist-1" }),
    );

    fireEvent.click(screen.getByRole("button", { name: en.library.deletePlaylist }));
    expect(onDeletePlaylist).toHaveBeenCalledWith("playlist-1");
  });

  it("renders the empty playlist message when there are no playlists yet", () => {
    renderWithI18n(
      <LibraryPlaylistsPanel
        playlistEditorId={null}
        playlistEditorOpen={false}
        playlistName=""
        playlistTrackIds={[]}
        playlists={[]}
        selectedPlaylistId={null}
        tracks={[]}
        onDeletePlaylist={vi.fn()}
        onOpenPlaylistEditor={vi.fn()}
        onResetPlaylistEditor={vi.fn()}
        onSavePlaylist={vi.fn()}
        onSelectPlaylist={vi.fn()}
        onSetPlaylistName={vi.fn()}
        onTogglePlaylistTrack={vi.fn()}
      />,
    );

    expect(screen.getByText(en.library.noBasePlaylists)).toBeInTheDocument();
  });
});
