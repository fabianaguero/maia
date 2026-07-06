import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { tauriInvokeMock } = vi.hoisted(() => ({
  tauriInvokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: tauriInvokeMock,
}));

import {
  invoke,
  invokeOrFallback,
  invokeWithBridgeRetry,
  isNativeBridgeUnavailable,
} from "../../src/api/tauri";

function enableNativeBridge(): void {
  (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
}

function disableNativeBridge(): void {
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
}

describe("tauri api bridge helpers", () => {
  beforeEach(() => {
    tauriInvokeMock.mockReset();
    disableNativeBridge();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    disableNativeBridge();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("detects native bridge unavailability errors", () => {
    expect(isNativeBridgeUnavailable(new Error("Tauri native bridge not available"))).toBe(true);
    expect(
      isNativeBridgeUnavailable(
        new Error("Cannot read properties of undefined (reading 'invoke')"),
      ),
    ).toBe(true);
    expect(isNativeBridgeUnavailable(new Error("Network timeout"))).toBe(false);
    expect(isNativeBridgeUnavailable("not-an-error")).toBe(false);
  });

  it("throws without a native bridge and calls Tauri invoke when available", async () => {
    await expect(invoke("list_tracks")).rejects.toThrow("Tauri native bridge not available");

    enableNativeBridge();
    tauriInvokeMock.mockResolvedValueOnce(["ok"]);

    await expect(invoke("list_tracks", { page: 1 })).resolves.toEqual(["ok"]);
    expect(tauriInvokeMock).toHaveBeenCalledWith("list_tracks", { page: 1 });
  });

  it("accepts the legacy __TAURI__ bridge shape too", async () => {
    (window as Window & { __TAURI__?: unknown }).__TAURI__ = {};
    tauriInvokeMock.mockResolvedValueOnce(["legacy-ok"]);

    await expect(invoke("list_tracks")).resolves.toEqual(["legacy-ok"]);
    expect(tauriInvokeMock).toHaveBeenCalledWith("list_tracks", undefined);
  });

  it("falls back immediately in browser mode when the bridge is unavailable", async () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0");

    const fallback = vi.fn(async () => "fallback-result");

    await expect(invokeOrFallback("list_tracks", undefined, fallback)).resolves.toBe(
      "fallback-result",
    );
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(tauriInvokeMock).not.toHaveBeenCalled();
  });

  it("waits for the bridge in Tauri mode and retries the invoke path", async () => {
    vi.useFakeTimers();
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Tauri");
    tauriInvokeMock.mockResolvedValueOnce({ status: "ok" });

    window.setTimeout(() => {
      enableNativeBridge();
    }, 50);

    const pending = invokeOrFallback("bootstrap", { input: 1 }, async () => "fallback");
    await vi.advanceTimersByTimeAsync(100);

    await expect(pending).resolves.toEqual({ status: "ok" });
    expect(tauriInvokeMock).toHaveBeenCalledTimes(1);
    expect(tauriInvokeMock).toHaveBeenCalledWith("bootstrap", { input: 1 });
  });

  it("falls back after waiting in Tauri mode when the bridge never appears", async () => {
    vi.useFakeTimers();
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Tauri");

    const fallback = vi.fn(async () => "late-fallback");

    const pending = invokeOrFallback("bootstrap", { input: 1 }, fallback);
    await vi.advanceTimersByTimeAsync(1600);

    await expect(pending).resolves.toBe("late-fallback");
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(tauriInvokeMock).not.toHaveBeenCalled();
  });

  it("rethrows unrelated errors instead of falling back", async () => {
    enableNativeBridge();
    tauriInvokeMock.mockRejectedValueOnce(new Error("Permission denied"));

    await expect(invokeOrFallback("danger", undefined, async () => "fallback")).rejects.toThrow(
      "Permission denied",
    );
  });

  it("retries invokeWithBridgeRetry when a native bridge error resolves after waiting", async () => {
    vi.useFakeTimers();
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Tauri");

    enableNativeBridge();
    tauriInvokeMock
      .mockRejectedValueOnce(new Error("ipc error"))
      .mockResolvedValueOnce({ ready: true });

    const pending = invokeWithBridgeRetry("resume_audio", { force: true });
    await vi.advanceTimersByTimeAsync(60);

    await expect(pending).resolves.toEqual({ ready: true });
    expect(tauriInvokeMock).toHaveBeenCalledTimes(2);
    expect(tauriInvokeMock).toHaveBeenNthCalledWith(1, "resume_audio", { force: true });
    expect(tauriInvokeMock).toHaveBeenNthCalledWith(2, "resume_audio", { force: true });
  });

  it("rethrows when invokeWithBridgeRetry cannot recover the bridge", async () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0");

    await expect(invokeWithBridgeRetry("resume_audio")).rejects.toThrow(
      "Tauri native bridge not available",
    );
  });

  it("rethrows the original bridge error after timing out in Tauri mode", async () => {
    vi.useFakeTimers();
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Tauri");

    const pending = expect(invokeWithBridgeRetry("resume_audio")).rejects.toThrow(
      "Tauri native bridge not available",
    );
    await vi.advanceTimersByTimeAsync(1600);
    await pending;
    expect(tauriInvokeMock).not.toHaveBeenCalled();
  });
});
