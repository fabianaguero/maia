import { invoke as tauriInvoke } from "@tauri-apps/api/core";

type InvokeArgs = Record<string, unknown> | undefined;

// Safe wrapper around invoke that handles non-Tauri environments
export async function invoke<T>(command: string, args?: InvokeArgs): Promise<T> {
  if (!tauriInvoke) {
    throw new Error("Tauri runtime not available");
  }
  return tauriInvoke<T>(command, args);
}

const BRIDGE_WAIT_TIMEOUT_MS = 1500;
const BRIDGE_POLL_INTERVAL_MS = 50;

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
};

export function isNativeBridgeUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    /tauri|__TAURI_INTERNALS__|ipc|native bridge/i.test(error.message)
  );
}

function hasNativeBridge(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const tauriWindow = window as TauriWindow;
  return Boolean(tauriWindow.__TAURI_INTERNALS__ || tauriWindow.__TAURI__);
}

function shouldWaitForNativeBridge(): boolean {
  if (hasNativeBridge()) {
    return true;
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  return /tauri/i.test(navigator.userAgent);
}

async function waitForNativeBridge(timeoutMs = BRIDGE_WAIT_TIMEOUT_MS): Promise<boolean> {
  if (hasNativeBridge()) {
    return true;
  }

  if (typeof window === "undefined" || !shouldWaitForNativeBridge()) {
    return false;
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, BRIDGE_POLL_INTERVAL_MS));

    if (hasNativeBridge()) {
      return true;
    }
  }

  return hasNativeBridge();
}

export async function invokeOrFallback<T>(
  command: string,
  args: InvokeArgs,
  fallback: () => Promise<T> | T,
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    if (!isNativeBridgeUnavailable(error)) {
      throw error;
    }

    const bridgeReady = await waitForNativeBridge();

    if (bridgeReady) {
      return await invoke<T>(command, args);
    }

    return await fallback();
  }
}

export async function invokeWithBridgeRetry<T>(
  command: string,
  args?: InvokeArgs,
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    if (!isNativeBridgeUnavailable(error)) {
      throw error;
    }

    const bridgeReady = await waitForNativeBridge();

    if (!bridgeReady) {
      throw error;
    }

    return await invoke<T>(command, args);
  }
}
