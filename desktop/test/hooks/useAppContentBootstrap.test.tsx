import { renderHook, waitFor } from "@testing-library/react";
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
});
