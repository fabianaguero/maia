import { invoke } from "@tauri-apps/api/core";

import {
  CONTRACT_VERSION,
  type AnalyzerRequest,
  type AnalyzerResponse,
  type BootstrapManifest,
} from "../contracts";

const frontendOnlyManifest: BootstrapManifest = {
  appName: "Maia",
  contractVersion: CONTRACT_VERSION,
  repoRoot: ".",
  analyzerEntrypoint: "mock-analyzer",
  contractsDir: "../contracts",
  databaseSchema: "../database/schema.sql",
  databasePath: "Unavailable outside Tauri",
  persistenceMode: "local-storage-fallback",
  docsDir: "../docs",
  runtimeMode: "frontend-only",
};

export async function loadBootstrapManifest(): Promise<BootstrapManifest> {
  try {
    return await invoke<BootstrapManifest>("bootstrap_manifest");
  } catch {
    return frontendOnlyManifest;
  }
}

export async function runAnalyzerRequest(
  request: AnalyzerRequest,
): Promise<AnalyzerResponse> {
  try {
    return await invoke<AnalyzerResponse>("run_analyzer", { request });
  } catch (error) {
    if (request.action === "health") {
      return {
        contractVersion: CONTRACT_VERSION,
        requestId: request.requestId,
        status: "ok",
        payload: {
          analyzerVersion: "frontend-only",
          runtime: "browser",
          supportedActions: ["health"],
          modes: ["mock"],
        },
        warnings: [
          "Tauri runtime not detected. Open the desktop shell with `npm run tauri dev` for native analyzer IPC.",
        ],
      };
    }

    return {
      contractVersion: CONTRACT_VERSION,
      requestId: request.requestId,
      status: "error",
      error: {
        code: "tauri_unavailable",
        message:
          error instanceof Error ? error.message : "Tauri runtime is unavailable.",
      },
      warnings: [
        "The React shell is running without the native bridge. Analyzer requests require Tauri.",
      ],
    };
  }
}
