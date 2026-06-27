import { describe, expect, it, vi } from "vitest";

import {
  fetchAndDecodeManagedSampleSources,
  resolveResolvableManagedSampleSources,
} from "../../src/features/analyzer/components/liveLogMonitorSampleRuntime";

describe("liveLogMonitorSampleRuntime", () => {
  it("keeps only resolvable managed sample sources", () => {
    const sources = resolveResolvableManagedSampleSources(
      [
        { path: "/tmp/kick.wav", label: "kick" },
        { path: "", label: "missing" },
      ],
      false,
    );

    expect(sources).toHaveLength(1);
    expect(sources[0]?.path).toBe("/tmp/kick.wav");
    expect(sources[0]?.url).toBe("/tmp/kick.wav");
  });

  it("fetches and decodes sample sources through the provided context", async () => {
    const decodeAudioData = vi.fn(async () => ({ id: "decoded-buffer" } as unknown as AudioBuffer));
    const context = { decodeAudioData } as unknown as AudioContext;
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(16),
    })) as unknown as typeof fetch;

    const decoded = await fetchAndDecodeManagedSampleSources(
      context,
      [{ path: "/tmp/kick.wav", label: "kick", url: "http://localhost/kick.wav" }],
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledWith("http://localhost/kick.wav");
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(decoded[0]?.[0]).toBe("/tmp/kick.wav");
  });
});
