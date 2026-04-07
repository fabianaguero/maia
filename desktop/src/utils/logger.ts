// ---------------------------------------------------------------------------
// Structured logger — Java-style levels: TRACE, DEBUG, INFO, WARN, ERROR
// Dual output: console.log (WebKitGTK DevTools) + file via Tauri invoke.
// ---------------------------------------------------------------------------

import { invoke } from "@tauri-apps/api/core";

type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

/** Change this to raise/lower the global log floor. */
let globalLevel: LogLevel = "TRACE";

// Buffer logs until Tauri IPC is ready
let ipcReady = false;
const pendingLogs: string[] = [];

// Test IPC availability once
invoke("log_to_terminal", { level: "INFO", message: "=== MAIA LOGGER INITIALIZED ===" })
  .then(() => {
    ipcReady = true;
    // Flush buffered logs
    for (const msg of pendingLogs) {
      invoke("log_to_terminal", { level: "INFO", message: msg }).catch(() => {});
    }
    pendingLogs.length = 0;
  })
  .catch(() => {
    // IPC not available — file fallback mode
    console.warn("[Logger] Tauri IPC not available — using console-only mode");
  });

export function setLogLevel(level: LogLevel): void {
  globalLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[globalLevel];
}

function formatTag(tag: string): string {
  return `[${tag}]`;
}

function ts(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function emit(level: LogLevel, tag: string, msg: string, ...args: unknown[]): void {
  if (!shouldLog(level)) return;
  const prefix = `${ts()} ${level.padEnd(5)} ${formatTag(tag)}`;
  const parts = args.map((a) =>
    typeof a === "string" ? a : JSON.stringify(a) ?? String(a),
  );
  const full = [prefix, msg, ...parts].join(" ");

  // Send to Rust terminal
  if (ipcReady) {
    invoke("log_to_terminal", { level, message: full }).catch(() => {});
  } else {
    pendingLogs.push(full);
  }

  // Also keep in browser console
  if (level === "ERROR") {
    console.error(full);
  } else {
    console.log(full);
  }
}

export interface Logger {
  trace: (msg: string, ...args: unknown[]) => void;
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
}

export function getLogger(tag: string): Logger {
  return {
    trace: (msg, ...args) => emit("TRACE", tag, msg, ...args),
    debug: (msg, ...args) => emit("DEBUG", tag, msg, ...args),
    info: (msg, ...args) => emit("INFO", tag, msg, ...args),
    warn: (msg, ...args) => emit("WARN", tag, msg, ...args),
    error: (msg, ...args) => emit("ERROR", tag, msg, ...args),
  };
}
