import { afterEach, describe, expect, it, vi } from "vitest";

async function loadMusicStylesWithCatalog(rawCatalog: unknown) {
  vi.resetModules();
  vi.doMock("../../src/config/music-styles.json", () => ({
    default: rawCatalog,
  }));

  const module = await import("../../src/config/musicStyles");
  vi.doUnmock("../../src/config/music-styles.json");
  return module;
}

describe("musicStyles", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../../src/config/music-styles.json");
  });

  it("falls back to the built-in catalog when the source catalog is unusable", async () => {
    const module = await loadMusicStylesWithCatalog({
      defaultTrackMusicStyleId: "missing",
      musicStyles: [{ id: "", label: "", description: "", minBpm: "fast", maxBpm: null }],
    });

    expect(module.musicStyleCatalog.defaultTrackMusicStyleId).toBe("house");
    expect(module.resolveMusicStyle("house")?.label).toBe("House");
    expect(module.fallbackMusicStyleLabel(undefined)).toBe("Not set");
  });

  it("normalizes BPM bounds and chooses the first valid style when the default id is invalid", async () => {
    const module = await loadMusicStylesWithCatalog({
      defaultTrackMusicStyleId: "missing",
      musicStyles: [
        {
          id: " glitch ",
          label: " Glitch ",
          description: " Fractured breaks ",
          minBpm: 136.4,
          maxBpm: 128.2,
        },
        {
          id: "ambient",
          label: "Ambient",
          description: "Slow and wide",
          minBpm: 90,
          maxBpm: 110,
        },
      ],
    });

    expect(module.musicStyleCatalog.defaultTrackMusicStyleId).toBe("glitch");
    expect(module.musicStyleCatalog.musicStyles[0]).toMatchObject({
      id: "glitch",
      label: "Glitch",
      description: "Fractured breaks",
      minBpm: 128,
      maxBpm: 136,
    });
    expect(module.resolveMusicStyle("ambient")?.maxBpm).toBe(110);
    expect(module.fallbackMusicStyleLabel(" custom-style ")).toBe(" custom-style ");
  });
});
