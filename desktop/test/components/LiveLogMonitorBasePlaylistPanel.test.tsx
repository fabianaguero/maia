import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorBasePlaylistPanel } from "../../src/features/analyzer/components/LiveLogMonitorBasePlaylistPanel";

describe("LiveLogMonitorBasePlaylistPanel", () => {
  it("renders playlist controls and delegates actions", () => {
    const onPlaylistNameChange = vi.fn();
    const onAddTrack = vi.fn();
    const onLoadPlaylist = vi.fn();
    const onMoveTrackUp = vi.fn();
    const onMoveTrackDown = vi.fn();
    const onRemoveTrack = vi.fn();

    render(
      <LiveLogMonitorBasePlaylistPanel
        playlistName="Base playlist"
        labels={{
          title: "Base listening bed",
          stableBedCopy: "Stable bed copy",
          namePlaceholder: "Name playlist",
          lost: "LOST",
          addBaseTrack: "Add base track",
          addAction: "Add",
          loadSavedPlaylist: "Load saved playlist",
          loadAction: "Load",
          moveUp: (name) => `Move up ${name}`,
          moveDown: (name) => `Move down ${name}`,
          removeFromPlaylist: (name) => `Remove ${name}`,
          intendedListeningBedHint: "Empty",
        }}
        pendingAddTrackId="track-1"
        pendingLoadPlaylistId="playlist-1"
        addTrackOptions={[
          { id: "track-1", label: "Warehouse · 126 BPM" },
          { id: "track-2", label: "Lost track", disabled: true },
        ]}
        savedPlaylistOptions={[{ id: "playlist-1", label: "Night set · 3 tracks" }]}
        playlistItems={[
          {
            id: "track-1",
            label: "Warehouse · 126 BPM",
            lostTitle: null,
            canMoveUp: false,
            canMoveDown: true,
          },
          {
            id: "track-2",
            label: "Lost track · 124 BPM",
            lostTitle: "Missing file",
            canMoveUp: true,
            canMoveDown: false,
          },
        ]}
        onPlaylistNameChange={onPlaylistNameChange}
        onPendingAddTrackIdChange={vi.fn()}
        onPendingLoadPlaylistIdChange={vi.fn()}
        onAddTrack={onAddTrack}
        onLoadPlaylist={onLoadPlaylist}
        onMoveTrackUp={onMoveTrackUp}
        onMoveTrackDown={onMoveTrackDown}
        onRemoveTrack={onRemoveTrack}
      />,
    );

    fireEvent.change(screen.getByLabelText("Base listening bed"), {
      target: { value: "New playlist" },
    });
    fireEvent.click(screen.getByText("Add"));
    fireEvent.click(screen.getByText("Load"));
    fireEvent.click(screen.getByLabelText("Move down Warehouse · 126 BPM"));
    fireEvent.click(screen.getByLabelText("Move up Lost track · 124 BPM"));
    fireEvent.click(screen.getByLabelText("Remove Lost track · 124 BPM"));

    expect(screen.getByText("LOST")).toBeTruthy();
    expect(onPlaylistNameChange).toHaveBeenCalledWith("New playlist");
    expect(onAddTrack).toHaveBeenCalledTimes(1);
    expect(onLoadPlaylist).toHaveBeenCalledTimes(1);
    expect(onMoveTrackDown).toHaveBeenCalledWith("track-1");
    expect(onMoveTrackUp).toHaveBeenCalledWith("track-2");
    expect(onRemoveTrack).toHaveBeenCalledWith("track-2");
  });
});
