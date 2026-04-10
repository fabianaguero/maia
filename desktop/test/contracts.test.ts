import { describe, expect, it } from "vitest";

import {
  CONTRACT_VERSION,
  createAnalyzeRepositoryRequest,
  createAnalyzeTrackRequest,
  createHealthRequest,
  createRepoAnalysisRequest,
} from "../src/contracts";

describe("desktop analyzer contracts", () => {
  it("creates a health request with the expected contract envelope", () => {
    const request = createHealthRequest();

    expect(request.contractVersion).toBe(CONTRACT_VERSION);
    expect(request.action).toBe("health");
    expect(request.payload).toEqual({});
    expect(request.requestId).toMatch(/^health-/);
  });

  it("creates a track analysis request with waveform capture enabled", () => {
    const request = createAnalyzeTrackRequest("/tmp/demo.wav");

    expect(request.contractVersion).toBe(CONTRACT_VERSION);
    expect(request.requestId).toMatch(/^track-/);
    expect(request.payload).toEqual({
      assetType: "track_analysis",
      source: {
        kind: "file",
        path: "/tmp/demo.wav",
      },
      options: {
        waveformBins: 256,
        beatGridResolution: 1,
        captureBpmCurve: true,
      },
    });
  });

  it("creates repository requests from either raw kind/path or a structured source", () => {
    const rawRequest = createAnalyzeRepositoryRequest("directory", "/srv/repo");
    const sourceRequest = createRepoAnalysisRequest({
      kind: "url",
      path: "https://example.com/stream",
      label: "remote stream",
    });

    expect(rawRequest.requestId).toMatch(/^repo-/);
    expect(rawRequest.payload).toEqual({
      assetType: "repo_analysis",
      source: {
        kind: "directory",
        path: "/srv/repo",
      },
      options: {
        inferCodeSuggestedBpm: true,
      },
    });

    expect(sourceRequest.payload).toEqual({
      assetType: "repo_analysis",
      source: {
        kind: "url",
        path: "https://example.com/stream",
        label: "remote stream",
      },
      options: {
        inferCodeSuggestedBpm: true,
      },
    });
  });
});
