import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppContentBootstrap } from "../../src/hooks/useAppContentBootstrap";

const analyzerMock = vi.hoisted(() => ({
  loadBootstrapManifest: vi.fn(),
  runAnalyzerRequest: vi.fn(),
}));

const contractsMock = vi.hoisted(() => ({
  createHealthRequest: vi.fn(() => ({ action: "health" })),
}));

vi.mock("../../src/api/analyzer", () => analyzerMock);
vi.mock("../../src/contracts", async () => {
  const actual = await vi.importActual("../../src/contracts");
  return {
    ...actual,
    createHealthRequest: contractsMock.createHealthRequest,
  };
});

describe("useAppContentBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    analyzerMock.loadBootstrapManifest.mockResolvedValue({ version: "1.0.0" });
    analyzerMock.runAnalyzerRequest.mockResolvedValue({
      status: "ok",
      payload: { summary: "healthy" },
      warnings: [],
    });
  });

  it("hydrates manifest and health while clearing the booting state", async () => {
    const { result } = renderHook(() => useAppContentBootstrap());

    await waitFor(() => {
      expect(result.current.booting).toBe(false);
    });

    expect(analyzerMock.loadBootstrapManifest).toHaveBeenCalled();
    expect(contractsMock.createHealthRequest).toHaveBeenCalled();
    expect(analyzerMock.runAnalyzerRequest).toHaveBeenCalledWith({ action: "health" });
    expect(result.current.manifest).toEqual({ version: "1.0.0" });
    expect(result.current.health).toEqual({
      status: "ok",
      payload: { summary: "healthy" },
      warnings: [],
    });
  });

  it("clears booting even when bootstrap requests fail", async () => {
    analyzerMock.loadBootstrapManifest.mockRejectedValueOnce(new Error("manifest failed"));

    const { result } = renderHook(() => useAppContentBootstrap());

    await waitFor(() => {
      expect(result.current.booting).toBe(false);
    });

    expect(result.current.manifest).toBeNull();
    expect(result.current.health).toBeNull();
  });

  it("does not publish bootstrap results after unmount", async () => {
    let resolveManifest: ((value: { version: string }) => void) | null = null;
    let resolveHealth:
      | ((value: { status: string; payload: { summary: string }; warnings: [] }) => void)
      | null = null;

    analyzerMock.loadBootstrapManifest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveManifest = resolve;
        }),
    );
    analyzerMock.runAnalyzerRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveHealth = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useAppContentBootstrap());
    unmount();

    await act(async () => {
      resolveManifest?.({ version: "2.0.0" });
      resolveHealth?.({
        status: "ok",
        payload: { summary: "late" },
        warnings: [],
      });
      await Promise.resolve();
    });

    expect(result.current.booting).toBe(true);
    expect(result.current.manifest).toBeNull();
    expect(result.current.health).toBeNull();
  });
});
