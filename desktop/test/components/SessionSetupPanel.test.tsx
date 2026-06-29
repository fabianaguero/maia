import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { afterEach } from "vitest";

import { SessionSetupPanel } from "../../src/features/session/SessionSetupPanel";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../src/types/library";

afterEach(() => {
  cleanup();
});

function renderPanel(overrides: Partial<ComponentProps<typeof SessionSetupPanel>> = {}) {
  const track = {
    id: "track-1",
    tags: { title: "Base Pulse" },
    analysis: { bpm: 126 },
  } as LibraryTrack;
  const source = {
    id: "repo-1",
    title: "customers-service",
    sourcePath: "/logs/customers-service.log",
  } as RepositoryAnalysis;

  return render(
    <I18nContext.Provider value={en}>
      <SessionSetupPanel
        tracks={[track]}
        playlists={[] as BaseTrackPlaylist[]}
        sourceOptions={[source]}
        mode="log"
        baseMode="track"
        selectedTemplateId="deep-house"
        selectedSourceId={null}
        selectedTrackId={null}
        selectedPlaylistId={null}
        selectedSource={null}
        selectedTrack={null}
        selectedPlaylist={null}
        selectedBaseLabel={null}
        selectedBaseDetail={null}
        sessionLabel=""
        sessionLabelPlaceholder="Night watch"
        creating={false}
        mutating={false}
        onTemplateSelect={vi.fn()}
        onBaseModeChange={vi.fn()}
        onTrackSelect={vi.fn()}
        onPlaylistSelect={vi.fn()}
        onModeChange={vi.fn()}
        onSourceSelect={vi.fn()}
        onSessionLabelChange={vi.fn()}
        onCreateSession={vi.fn()}
        {...overrides}
      />
    </I18nContext.Provider>,
  );
}

describe("SessionSetupPanel", () => {
  it("keeps start disabled until source and base are selected", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: /start session/i })).toBeDisabled();
  });

  it("renders workflow and setup surfaces", () => {
    renderPanel();

    expect(screen.getAllByText("New session").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /start session/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText("Night watch").length).toBeGreaterThan(0);
  });

  it("wires template, label and create actions when source and base are selected", () => {
    const onTemplateSelect = vi.fn();
    const onSessionLabelChange = vi.fn();
    const onCreateSession = vi.fn();
    const track = {
      id: "track-1",
      tags: { title: "Base Pulse" },
      analysis: { bpm: 126 },
    } as LibraryTrack;
    const source = {
      id: "repo-1",
      title: "customers-service",
      sourcePath: "/logs/customers-service.log",
    } as RepositoryAnalysis;

    renderPanel({
      tracks: [track],
      sourceOptions: [source],
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedSource: source,
      selectedTrack: track,
      selectedBaseLabel: "Base Pulse",
      selectedBaseDetail: "126 BPM",
      onTemplateSelect,
      onSessionLabelChange,
      onCreateSession,
    });

    fireEvent.click(screen.getByRole("button", { name: /peak techno/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Incident watch" } });
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));

    expect(onTemplateSelect).toHaveBeenCalledWith("peak-techno");
    expect(onSessionLabelChange).toHaveBeenCalledWith("Incident watch");
    expect(onCreateSession).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("Base Pulse").length).toBeGreaterThan(0);
    expect(screen.getAllByText("customers-service").length).toBeGreaterThan(0);
  });

  it("supports playlist mode when the playlist path is selected", () => {
    const playlist = {
      id: "playlist-1",
      name: "Night watch",
      trackIds: ["track-1"],
      createdAt: "2026-06-28T10:00:00.000Z",
      updatedAt: "2026-06-28T10:10:00.000Z",
    } as BaseTrackPlaylist;
    const source = {
      id: "repo-2",
      title: "repo-stream",
      sourcePath: "/repos/services",
      sourceKind: "repo",
    } as RepositoryAnalysis;

    renderPanel({
      playlists: [playlist],
      sourceOptions: [source],
      mode: "repo",
      baseMode: "playlist",
      selectedSourceId: "repo-2",
      selectedPlaylistId: "playlist-1",
      selectedSource: source,
      selectedPlaylist: playlist,
      selectedBaseLabel: "Night watch",
      selectedBaseDetail: "1 sounds · Median 126 BPM",
    });

    expect(screen.getByRole("button", { name: /start session/i })).toBeEnabled();
    expect(screen.getAllByText("Night watch").length).toBeGreaterThan(0);
    expect(screen.getAllByText("repo-stream").length).toBeGreaterThan(0);
  });
});
