import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LibraryFormDrawer } from "../../src/features/library/components/LibraryFormDrawer";

const importTrackFormMock = vi.fn();
const importRepositoryFormMock = vi.fn();
const importBaseAssetFormMock = vi.fn();

vi.mock("../../src/features/library/components/ImportTrackForm", () => ({
  ImportTrackForm: (props: {
    defaultMusicStyleId?: string;
    onSeedDemo: () => Promise<void>;
  }) => {
    importTrackFormMock(props);
    return (
      <button type="button" onClick={() => void props.onSeedDemo()}>
        track-form
      </button>
    );
  },
}));

vi.mock("../../src/features/library/components/ImportRepositoryForm", () => ({
  ImportRepositoryForm: (props: {
    defaultDirectoryPath?: string;
    onLogConnectionSaved: () => void;
  }) => {
    importRepositoryFormMock(props);
    return (
      <button type="button" onClick={props.onLogConnectionSaved}>
        repository-form
      </button>
    );
  },
}));

vi.mock("../../src/features/library/components/ImportBaseAssetForm", () => ({
  ImportBaseAssetForm: (props: { defaultCategoryId?: string }) => {
    importBaseAssetFormMock(props);
    return <div>base-asset-form</div>;
  },
}));

describe("LibraryFormDrawer", () => {
  it("returns null when hidden", () => {
    const { container } = render(
      <LibraryFormDrawer
        visible={false}
        tab="tracks"
        manifest={null}
        musicStyles={[]}
        baseAssetCategories={[]}
        trackBusy={false}
        repositoryBusy={false}
        baseAssetBusy={false}
        onImportTrack={vi.fn()}
        onImportRepository={vi.fn()}
        onImportBaseAsset={vi.fn()}
        onSeedDemo={vi.fn()}
        onClose={vi.fn()}
        onLogConnectionSaved={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("routes each tab to the expected inner form and preserves shell callbacks", async () => {
    const onSeedDemo = vi.fn(async () => undefined);
    const onClose = vi.fn();
    const onLogConnectionSaved = vi.fn();

    const { rerender } = render(
      <LibraryFormDrawer
        visible={true}
        tab="tracks"
        manifest={null}
        musicStyles={[]}
        baseAssetCategories={[]}
        defaultTrackMusicStyleId="house"
        trackBusy={false}
        repositoryBusy={false}
        baseAssetBusy={false}
        onImportTrack={vi.fn()}
        onImportRepository={vi.fn()}
        onImportBaseAsset={vi.fn()}
        onSeedDemo={onSeedDemo}
        onClose={onClose}
        onLogConnectionSaved={onLogConnectionSaved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "track-form" }));
    expect(onSeedDemo).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(importTrackFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ defaultMusicStyleId: "house" }),
    );

    rerender(
      <LibraryFormDrawer
        visible={true}
        tab="connections"
        manifest={{ repoRoot: "/repo/root" } as never}
        musicStyles={[]}
        baseAssetCategories={[]}
        trackBusy={false}
        repositoryBusy={false}
        baseAssetBusy={false}
        onImportTrack={vi.fn()}
        onImportRepository={vi.fn()}
        onImportBaseAsset={vi.fn()}
        onSeedDemo={onSeedDemo}
        onClose={onClose}
        onLogConnectionSaved={onLogConnectionSaved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "repository-form" }));
    expect(onLogConnectionSaved).toHaveBeenCalledTimes(1);
    expect(importRepositoryFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ defaultDirectoryPath: "/repo/root" }),
    );

    rerender(
      <LibraryFormDrawer
        visible={true}
        tab="bases"
        manifest={null}
        musicStyles={[]}
        baseAssetCategories={[]}
        defaultBaseAssetCategoryId="reactive"
        trackBusy={false}
        repositoryBusy={false}
        baseAssetBusy={false}
        onImportTrack={vi.fn()}
        onImportRepository={vi.fn()}
        onImportBaseAsset={vi.fn()}
        onSeedDemo={onSeedDemo}
        onClose={onClose}
        onLogConnectionSaved={onLogConnectionSaved}
      />,
    );

    expect(screen.getByText("base-asset-form")).toBeInTheDocument();
    expect(importBaseAssetFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ defaultCategoryId: "reactive" }),
    );
  });
});
