import { describe, expect, it, vi } from "vitest";

import {
  runCatalogBooleanAction,
  runCatalogResultAction,
  runCatalogUpdateAction,
} from "../../src/hooks/appCatalogLibraryActionsRuntime";

describe("appCatalogLibraryActionsRuntime", () => {
  it("handles result actions for success, empty and error cases", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogResultAction({
        task: async () => ({ name: "Track" }),
        onSuccess: (result) => ({ tone: "success", title: "ok", body: result.name }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(true);

    await expect(
      runCatalogResultAction({
        task: async () => null,
        onSuccess: () => ({ tone: "success", title: "ok", body: "ok" }),
        onEmpty: () => ({ tone: "info", title: "empty", body: "nope" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(false);

    await expect(
      runCatalogResultAction({
        task: async () => {
          throw new Error("broken");
        },
        onSuccess: () => ({ tone: "success", title: "ok", body: "ok" }),
        onError: (error) => ({ tone: "error", title: "err", body: String(error) }),
        notify,
      }),
    ).resolves.toBe(false);

    expect(notify).toHaveBeenCalledWith("success", "ok", "Track");
    expect(notify).toHaveBeenCalledWith("info", "empty", "nope");
    expect(notify).toHaveBeenCalledWith("error", "err", expect.stringContaining("broken"));
  });

  it("returns false for empty result actions without emitting a notice when onEmpty is missing", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogResultAction({
        task: async () => null,
        onSuccess: () => ({ tone: "success", title: "ok", body: "ok" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(false);

    expect(notify).not.toHaveBeenCalled();
  });

  it("handles boolean and update actions", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogBooleanAction({
        task: async () => true,
        onSuccess: () => ({ tone: "success", title: "deleted", body: "done" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(true);

    await expect(
      runCatalogBooleanAction({
        task: async () => false,
        onSuccess: () => ({ tone: "success", title: "deleted", body: "done" }),
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
        notify,
      }),
    ).resolves.toBe(false);

    await expect(
      runCatalogUpdateAction({
        task: async () => null,
        notify,
        onMissing: { tone: "error", title: "missing", body: "not found" },
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
      }),
    ).resolves.toBeUndefined();

    await expect(
      runCatalogUpdateAction({
        task: async () => {
          throw new Error("update broke");
        },
        notify,
        onMissing: { tone: "error", title: "missing", body: "not found" },
        onError: (error) => ({ tone: "error", title: "err", body: String(error) }),
      }),
    ).resolves.toBeUndefined();

    await expect(
      runCatalogUpdateAction({
        task: async () => ({ id: "updated" }),
        notify,
        onMissing: { tone: "error", title: "missing", body: "not found" },
        onError: () => ({ tone: "error", title: "err", body: "boom" }),
      }),
    ).resolves.toBeUndefined();

    expect(notify).toHaveBeenCalledWith("success", "deleted", "done");
    expect(notify).toHaveBeenCalledWith("error", "missing", "not found");
    expect(notify).toHaveBeenCalledWith("error", "err", expect.stringContaining("update broke"));
  });

  it("reports thrown errors for boolean actions", async () => {
    const notify = vi.fn();

    await expect(
      runCatalogBooleanAction({
        task: async () => {
          throw new Error("delete broke");
        },
        onSuccess: () => ({ tone: "success", title: "deleted", body: "done" }),
        onError: (error) => ({ tone: "error", title: "err", body: String(error) }),
        notify,
      }),
    ).resolves.toBe(false);

    expect(notify).toHaveBeenCalledWith("error", "err", expect.stringContaining("delete broke"));
  });
});
