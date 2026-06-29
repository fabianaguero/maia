import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectContextBar } from "../../src/features/inspect/InspectContextBar";

describe("InspectContextBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders mode tabs and delegates select changes", () => {
    const onChangeMode = vi.fn();
    const onSelectTrack = vi.fn();
    const onSelectRepository = vi.fn();
    const onSelectBaseAsset = vi.fn();

    render(
      <InspectContextBar
        mode="track"
        trackCount={2}
        repositoryCount={1}
        baseAssetCount={1}
        selectedTrackId="track-1"
        selectedRepositoryId="repo-1"
        selectedBaseAssetId="base-1"
        trackOptions={[
          { id: "track-1", label: "Track One" },
          { id: "track-2", label: "Track Two" },
        ]}
        repositoryOptions={[{ id: "repo-1", label: "Repo One" }]}
        baseAssetOptions={[{ id: "base-1", label: "Base One" }]}
        labels={{
          tracks: "Tracks",
          logSources: "Logs",
          bases: "Bases",
        }}
        onChangeMode={onChangeMode}
        onSelectTrack={onSelectTrack}
        onSelectRepository={onSelectRepository}
        onSelectBaseAsset={onSelectBaseAsset}
      />,
    );

    fireEvent.click(screen.getByText("Logs"));
    fireEvent.change(screen.getByDisplayValue("Track One"), {
      target: { value: "track-2" },
    });

    expect(onChangeMode).toHaveBeenCalledWith("repo");
    expect(onSelectTrack).toHaveBeenCalledWith("track-2");
  });

  it("switches repository and base selectors when the active mode changes", () => {
    const onChangeMode = vi.fn();
    const onSelectTrack = vi.fn();
    const onSelectRepository = vi.fn();
    const onSelectBaseAsset = vi.fn();

    const { rerender, container } = render(
      <InspectContextBar
        mode="repo"
        trackCount={1}
        repositoryCount={2}
        baseAssetCount={1}
        selectedTrackId="track-1"
        selectedRepositoryId="repo-1"
        selectedBaseAssetId="base-1"
        trackOptions={[{ id: "track-1", label: "Track One" }]}
        repositoryOptions={[
          { id: "repo-1", label: "Repo One" },
          { id: "repo-2", label: "Repo Two" },
        ]}
        baseAssetOptions={[{ id: "base-1", label: "Base One" }]}
        labels={{
          tracks: "Tracks",
          logSources: "Logs",
          bases: "Bases",
        }}
        onChangeMode={onChangeMode}
        onSelectTrack={onSelectTrack}
        onSelectRepository={onSelectRepository}
        onSelectBaseAsset={onSelectBaseAsset}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Repo One"), {
      target: { value: "repo-2" },
    });
    fireEvent.click(screen.getAllByRole("button").find((button) => button.textContent?.includes("Bases"))!);

    rerender(
      <InspectContextBar
        mode="base"
        trackCount={1}
        repositoryCount={2}
        baseAssetCount={1}
        selectedTrackId="track-1"
        selectedRepositoryId="repo-2"
        selectedBaseAssetId="base-1"
        trackOptions={[{ id: "track-1", label: "Track One" }]}
        repositoryOptions={[
          { id: "repo-1", label: "Repo One" },
          { id: "repo-2", label: "Repo Two" },
        ]}
        baseAssetOptions={[{ id: "base-1", label: "Base One" }]}
        labels={{
          tracks: "Tracks",
          logSources: "Logs",
          bases: "Bases",
        }}
        onChangeMode={onChangeMode}
        onSelectTrack={onSelectTrack}
        onSelectRepository={onSelectRepository}
        onSelectBaseAsset={onSelectBaseAsset}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Base One"), {
      target: { value: "base-1" },
    });

    expect(container.querySelectorAll(".context-select")).toHaveLength(1);

    expect(onSelectRepository).toHaveBeenCalledWith("repo-2");
    expect(onChangeMode).toHaveBeenCalledWith("base");
    expect(onSelectBaseAsset).toHaveBeenCalledWith("base-1");
  });

  it("hides tabs and selectors when counts are empty", () => {
    const { container } = render(
      <InspectContextBar
        mode="track"
        trackCount={0}
        repositoryCount={0}
        baseAssetCount={0}
        selectedTrackId={null}
        selectedRepositoryId={null}
        selectedBaseAssetId={null}
        trackOptions={[]}
        repositoryOptions={[]}
        baseAssetOptions={[]}
        labels={{
          tracks: "Tracks",
          logSources: "Logs",
          bases: "Bases",
        }}
        onChangeMode={vi.fn()}
        onSelectTrack={vi.fn()}
        onSelectRepository={vi.fn()}
        onSelectBaseAsset={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Tracks" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logs" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bases" })).not.toBeInTheDocument();
    expect(container.querySelector("select")).toBeNull();
  });
});
