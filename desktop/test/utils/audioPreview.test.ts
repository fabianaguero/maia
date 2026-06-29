import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { convertFileSrcMock, isTauriMock, readAudioBytesMock } = vi.hoisted(() => ({
  convertFileSrcMock: vi.fn(),
  isTauriMock: vi.fn(),
  readAudioBytesMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: convertFileSrcMock,
  isTauri: isTauriMock,
}));

vi.mock("../../src/api/repositories", () => ({
  readAudioBytes: readAudioBytesMock,
}));

import { resolvePreviewAudioUrl, revokePreviewAudioUrl } from "../../src/utils/audioPreview";

describe("audioPreview", () => {
  const fetchMock = vi.fn();
  const createObjectURLMock = vi.fn();
  const revokeObjectURLMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns remote preview URLs unchanged", async () => {
    await expect(resolvePreviewAudioUrl("https://cdn.example.com/preview.wav")).resolves.toBe(
      "https://cdn.example.com/preview.wav",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the local path directly outside Tauri", async () => {
    isTauriMock.mockReturnValue(false);

    await expect(resolvePreviewAudioUrl("/music/preview.wav")).resolves.toBe("/music/preview.wav");
    expect(convertFileSrcMock).not.toHaveBeenCalled();
  });

  it("uses the native file URL when Tauri can resolve it with a successful HEAD request", async () => {
    isTauriMock.mockReturnValue(true);
    convertFileSrcMock.mockReturnValue("asset://preview.wav");
    fetchMock.mockResolvedValue({ ok: true });

    await expect(resolvePreviewAudioUrl("/music/preview.wav")).resolves.toBe("asset://preview.wav");
    expect(fetchMock).toHaveBeenCalledWith("asset://preview.wav", { method: "HEAD" });
    expect(readAudioBytesMock).not.toHaveBeenCalled();
  });

  it("falls back to the native byte reader and blob URLs when the HEAD probe fails", async () => {
    isTauriMock.mockReturnValue(true);
    convertFileSrcMock.mockReturnValue("asset://preview.flac");
    fetchMock.mockRejectedValue(new Error("bridge offline"));
    readAudioBytesMock.mockResolvedValue("UklGRg==");
    createObjectURLMock.mockReturnValue("blob:preview-flac");

    await expect(resolvePreviewAudioUrl("/music/preview.flac")).resolves.toBe("blob:preview-flac");
    expect(readAudioBytesMock).toHaveBeenCalledWith("/music/preview.flac");
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it("revokes only blob preview URLs", () => {
    revokePreviewAudioUrl("blob:preview");
    revokePreviewAudioUrl("https://cdn.example.com/preview.wav");
    revokePreviewAudioUrl(null);

    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:preview");
  });
});
