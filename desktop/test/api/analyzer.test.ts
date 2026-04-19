import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

import {
  loadBootstrapManifest,
  runAnalyzerRequest,
} from "../../src/api/analyzer";
import {
  CONTRACT_VERSION,
  createAnalyzeTrackRequest,
  createHealthRequest,
  type BootstrapManifest,
} from "../../src/contracts";

describe("desktop analyzer bridge", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("loads the native bootstrap manifest when Tauri is available", async () => {
    const manifest: BootstrapManifest = {
      appName: "Maia",
      contractVersion: CONTRACT_VERSION,
      repoRoot: "/workspace",
      analyzerEntrypoint: "python -m maia_analyzer.cli",
      contractsDir: "/workspace/contracts",
      databaseSchema: "/workspace/database/schema.sql",
      databasePath: "/workspace/data/maia.db",
      persistenceMode: "sqlite",
      docsDir: "/workspace/docs",
      runtimeMode: "tauri",
      musicStyleConfigPath: "/workspace/desktop/src/config/music-styles.json",
      defaultTrackMusicStyleId: "house",
      musicStyles: [],
      baseAssetCategoryConfigPath:
        "/workspace/desktop/src/config/base-asset-categories.json",
      defaultBaseAssetCategoryId: "drums",
      baseAssetCategories: [],
    };

    invokeMock.mockResolvedValue(manifest);

    await expect(loadBootstrapManifest()).resolves.toEqual(manifest);
    expect(invokeMock).toHaveBeenCalledWith("bootstrap_manifest", undefined);
  });

  it("falls back to a frontend-only manifest when the native bridge is unavailable", async () => {
    invokeMock.mockRejectedValue(
      new Error("Cannot read properties of undefined (__TAURI_INTERNALS__)"),
    );

    const manifest = await loadBootstrapManifest();

    expect(manifest.runtimeMode).toBe("frontend-only");
    expect(manifest.persistenceMode).toBe("local-storage-fallback");
    expect(manifest.analyzerEntrypoint).toBe("mock-analyzer");
    expect(invokeMock).toHaveBeenCalledWith("bootstrap_manifest", undefined);
  });

  it("rethrows bootstrap errors unrelated to the native bridge", async () => {
    invokeMock.mockRejectedValue(new Error("bootstrap exploded"));

    await expect(loadBootstrapManifest()).rejects.toThrow("bootstrap exploded");
  });

  it("returns a health fallback payload when the desktop bridge is missing", async () => {
    invokeMock.mockRejectedValue(new Error("IPC transport missing"));

    const response = await runAnalyzerRequest(createHealthRequest());

    expect(response.status).toBe("ok");
    expect(response.requestId).toMatch(/^health-/);
    if (response.status === "ok") {
      expect(response.payload.runtime).toBe("browser");
      expect(response.payload.supportedActions).toEqual(["health"]);
    }
    expect(response.warnings[0]).toContain("npm run tauri dev");
    expect(invokeMock).toHaveBeenCalledWith("run_analyzer", {
      request: expect.objectContaining({ action: "health" }),
    });
  });

  it("returns a typed analyzer error for non-health requests without Tauri", async () => {
    invokeMock.mockRejectedValue(new Error("Tauri native bridge not available"));

    const response = await runAnalyzerRequest(
      createAnalyzeTrackRequest("/tmp/demo.wav"),
    );

    expect(response).toEqual({
      contractVersion: CONTRACT_VERSION,
      requestId: expect.stringMatching(/^track-/),
      status: "error",
      error: {
        code: "tauri_unavailable",
        message: "Tauri native bridge not available",
      },
      warnings: [
        "The React shell is running without the native bridge. Analyzer requests require Tauri.",
      ],
    });
  });
});
