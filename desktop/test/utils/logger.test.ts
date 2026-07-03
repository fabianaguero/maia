import { afterEach, describe, expect, it, vi } from "vitest";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

async function loadLoggerModule(input: {
  isTauri: boolean;
  invokeImpl?: ReturnType<typeof vi.fn>;
}) {
  vi.resetModules();
  const invoke = input.invokeImpl ?? vi.fn();
  vi.doMock("@tauri-apps/api/core", () => ({
    invoke,
    isTauri: () => input.isTauri,
  }));
  const loggerModule = await import("../../src/utils/logger");
  return { loggerModule, invoke };
}

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unmock("@tauri-apps/api/core");
  });

  it("respects the global log level and emits console output outside tauri", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { loggerModule, invoke } = await loadLoggerModule({ isTauri: false });

    loggerModule.setLogLevel("WARN");
    const logger = loggerModule.getLogger("MonitorCtx");
    logger.info("ignored info");
    logger.error("boom", { reason: "failure" });

    expect(invoke).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.[0]).toContain("[MonitorCtx]");
    expect(errorSpy.mock.calls[0]?.[0]).toContain("boom");
    expect(errorSpy.mock.calls[0]?.[0]).toContain('"reason":"failure"');
  });

  it("initializes tauri logging and flushes buffered messages once IPC is ready", async () => {
    const init = deferred<void>();
    const invoke = vi.fn(() => init.promise);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { loggerModule } = await loadLoggerModule({ isTauri: true, invokeImpl: invoke });

    const logger = loggerModule.getLogger("Deck");
    logger.info("buffered event");

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenNthCalledWith(1, "log_to_terminal", {
      level: "INFO",
      message: "=== MAIA LOGGER INITIALIZED ===",
    });

    init.resolve();
    await flushMicrotasks();

    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke).toHaveBeenNthCalledWith(2, "log_to_terminal", {
      level: "INFO",
      message: expect.stringContaining("[Deck] buffered event"),
    });
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("warns and stays console-only when tauri IPC bootstrap fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const invoke = vi.fn().mockRejectedValue(new Error("ipc missing"));
    const { loggerModule } = await loadLoggerModule({ isTauri: true, invokeImpl: invoke });

    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalledWith(
      "[Logger] Tauri IPC not available — using console-only mode",
    );

    const logger = loggerModule.getLogger("Shell");
    logger.warn("console fallback");

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0]?.[0]).toContain("[Shell]");
    expect(logSpy.mock.calls[0]?.[0]).toContain("console fallback");
  });
});
