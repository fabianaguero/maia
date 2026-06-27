import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InspectContextBar } from "../../src/features/inspect/InspectContextBar";

describe("InspectContextBar", () => {
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
});
