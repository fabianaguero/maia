import { describe, expect, it, vi } from "vitest";

import { loadCachedAudioBuffer } from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundBufferCacheRuntime";

describe("liveLogMonitorBackgroundBufferCacheRuntime", () => {
  it("returns null when cache key or url are missing", async () => {
    const context = { decodeAudioData: vi.fn() } as unknown as AudioContext;
    const cache = new Map<string, Promise<AudioBuffer>>();

    expect(
      await loadCachedAudioBuffer({
        cacheKey: null,
        url: "/tmp/demo.wav",
        context,
        cache,
      }),
    ).toBeNull();
    expect(
      await loadCachedAudioBuffer({
        cacheKey: "track-1",
        url: null,
        context,
        cache,
      }),
    ).toBeNull();
  });

  it("loads, caches and evicts decoded buffers across retries", async () => {
    const decodeAudioData = vi.fn(async () => ({ id: "decoded" }) as unknown as AudioBuffer);
    const context = { decodeAudioData } as unknown as AudioContext;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        arrayBuffer: async () => new ArrayBuffer(0),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(8),
      });
    const cache = new Map<string, Promise<AudioBuffer>>();

    await expect(
      loadCachedAudioBuffer({
        cacheKey: "track-1",
        url: "/tmp/demo.wav",
        context,
        cache,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow("HTTP 503 fetching guide track");
    expect(cache.size).toBe(0);

    const first = await loadCachedAudioBuffer({
      cacheKey: "track-1",
      url: "/tmp/demo.wav",
      context,
      cache,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const second = await loadCachedAudioBuffer({
      cacheKey: "track-1",
      url: "/tmp/demo.wav",
      context,
      cache,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(cache.size).toBe(1);
  });
});
