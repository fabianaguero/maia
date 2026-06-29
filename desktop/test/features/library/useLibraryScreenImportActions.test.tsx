import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLibraryScreenImportActions } from "../../../src/features/library/useLibraryScreenImportActions";

const deleteLogSourceConnection = vi.fn();

vi.mock("../../../src/api/repositories", () => ({
  deleteLogSourceConnection: (...args: unknown[]) => deleteLogSourceConnection(...args),
}));

function createInput() {
  return {
    onImportTrack: vi.fn(async () => true),
    onImportRepository: vi.fn(async () => true),
    onImportBaseAsset: vi.fn(async () => true),
    refreshLogConnections: vi.fn(async () => undefined),
    setShowForm: vi.fn(),
    setLogConnectionError: vi.fn(),
  };
}

describe("useLibraryScreenImportActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes log connections after importing a file-backed repository", async () => {
    const input = createInput();
    const { result } = renderHook(() => useLibraryScreenImportActions(input));

    await act(async () => {
      await result.current.handleImportRepository({
        sourceKind: "file",
        sourcePath: "/tmp/service.log",
        title: "service",
      } as never);
    });

    expect(input.onImportRepository).toHaveBeenCalled();
    expect(input.refreshLogConnections).toHaveBeenCalled();
    expect(input.setShowForm).toHaveBeenCalledWith(false);
  });

  it("surfaces log connection deletion failures through the provided setter", async () => {
    const input = createInput();
    deleteLogSourceConnection.mockRejectedValueOnce(new Error("delete failed"));
    const { result } = renderHook(() => useLibraryScreenImportActions(input));

    await act(async () => {
      await result.current.handleDeleteLogConnection("conn-1");
    });

    expect(input.setLogConnectionError).toHaveBeenCalledWith("delete failed");
  });
});
