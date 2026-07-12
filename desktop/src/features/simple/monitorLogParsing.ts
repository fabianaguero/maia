export type MonitorLogLevel = "trace" | "debug" | "info" | "warn" | "error";

export interface SonarQubeMeta {
  rule: string;
  component: string;
  line?: number;
  sonarSeverity: string;
}

export interface MonitorLogLine {
  id: string;
  timestamp: string;
  level: MonitorLogLevel;
  message: string;
  isAnomaly: boolean;
  anomalyId: string | null;
  sonarQubeMeta?: SonarQubeMeta;
}

export function formatCloudTimestamp(isoTimestamp: string): string {
  const trimmed = isoTimestamp.trim();
  if (!trimmed) {
    return new Date().toLocaleTimeString().split(" ")[0];
  }

  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) {
    const date = new Date(parsedMs);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const hours = `${date.getHours()}`.padStart(2, "0");
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    const seconds = `${date.getSeconds()}`.padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  return trimmed.replace("T", " ").replace(/\.\d+(?=Z?$)/, "");
}

export function normalizeMonitorLevel(rawLevel: string): MonitorLogLevel {
  const level = rawLevel.trim().toLowerCase();
  if (level === "warning") return "warn";
  if (level === "notice") return "info";
  if (level === "fatal" || level === "critical") return "error";
  if (
    level === "trace" ||
    level === "debug" ||
    level === "info" ||
    level === "warn" ||
    level === "error"
  ) {
    return level;
  }
  return "info";
}

export function isMonitorAnomaly(level: MonitorLogLevel, message: string): boolean {
  if (level === "error" || level === "warn") {
    return true;
  }

  return /\banomal(?:y|ia|ies)?\b|\btimeout\b|\bexception\b|\bfailed\b|\bfatal\b|\bpanic\b|\bunavailable\b|\binternal server error\b/i.test(
    message,
  );
}

function mapSonarQubeSeverityToLevel(sonarSeverity: string): MonitorLogLevel {
  const upper = sonarSeverity.toUpperCase();
  // Rust maps: BLOCKER/CRITICAL→"CRITICAL", MAJOR→"ERROR", MINOR→"WARN", else→"INFO"
  // So we map the resulting log_level: CRITICAL→error, ERROR→warn, WARN→warn, INFO→info
  if (upper === "CRITICAL") return "error";
  if (upper === "ERROR" || upper === "WARN") return "warn";
  return "info";
}

export function parseMonitorLogLine(raw: string, lineIndex: number): MonitorLogLine {
  const cloudSeverityFirstPattern = /^([A-Z]+)\s+(\d{4}-\d{2}-\d{2}T\S+)\s+(.*)$/;
  const cloudSeverityFirstMatch = raw.match(cloudSeverityFirstPattern);
  if (cloudSeverityFirstMatch) {
    const level = normalizeMonitorLevel(cloudSeverityFirstMatch[1] || "INFO");
    const isoTimestamp = cloudSeverityFirstMatch[2] ?? "";
    const message = (cloudSeverityFirstMatch[3] || "").trim() || raw.trim();
    const displayTimestamp = formatCloudTimestamp(isoTimestamp);
    const isAnomaly = isMonitorAnomaly(level, message);
    const anomalyId = isAnomaly ? `${displayTimestamp}-${lineIndex}-${message.slice(0, 48)}` : null;

    return {
      id: `${displayTimestamp}-${lineIndex}-${message.slice(0, 64)}`,
      timestamp: displayTimestamp,
      level,
      message,
      isAnomaly,
      anomalyId,
    };
  }

  const cloudTabPattern = /^(\d{4}-\d{2}-\d{2}T[^\t]+)\t([A-Z]+)?\t(.*)$/;
  const cloudMatch = raw.match(cloudTabPattern);
  if (cloudMatch) {
    const isoTimestamp = cloudMatch[1] ?? "";
    const level = normalizeMonitorLevel(cloudMatch[2] || "INFO");
    const message = (cloudMatch[3] || "").trim() || raw.trim();
    const displayTimestamp = formatCloudTimestamp(isoTimestamp);
    const isAnomaly = isMonitorAnomaly(level, message);
    const anomalyId = isAnomaly ? `${displayTimestamp}-${lineIndex}-${message.slice(0, 48)}` : null;

    return {
      id: `${displayTimestamp}-${lineIndex}-${message.slice(0, 64)}`,
      timestamp: displayTimestamp,
      level,
      message,
      isAnomaly,
      anomalyId,
    };
  }

  // SonarQube format: [timestamp] [SONARQUBE-LEVEL] rule message (component:line)
  // More flexible pattern that handles various spacing
  const sonarQubePattern = /^\[(.+?)\]\s*\[SONARQUBE-(\w+)\]\s+(\S+)\s+(.+?)\s*\(([^:)]+)(?::(\d+))?\)\s*$/;
  const sonarQubeMatch = raw.match(sonarQubePattern);
  if (sonarQubeMatch) {
    const timestamp = sonarQubeMatch[1] ?? "";
    const sonarSeverity = sonarQubeMatch[2] ?? "INFO";
    const rule = sonarQubeMatch[3] ?? "";
    const message = (sonarQubeMatch[4] || "").trim() || raw.trim();
    const component = sonarQubeMatch[5] ?? "";
    const lineNum = sonarQubeMatch[6] ? Number.parseInt(sonarQubeMatch[6], 10) : undefined;

    const level = mapSonarQubeSeverityToLevel(sonarSeverity);
    const isAnomaly = isMonitorAnomaly(level, message);
    const anomalyId = isAnomaly ? `${timestamp}-${lineIndex}-${message.slice(0, 48)}` : null;

    return {
      id: `${timestamp}-${lineIndex}-${message.slice(0, 64)}`,
      timestamp,
      level,
      message,
      isAnomaly,
      anomalyId,
      sonarQubeMeta: {
        rule,
        component,
        line: lineNum,
        sonarSeverity,
      },
    };
  }

  const levelMatch = raw.match(/\[(ERROR|WARN|INFO|DEBUG|TRACE)\]/i);
  const level = normalizeMonitorLevel(levelMatch ? levelMatch[1] : "info");
  const tsMatch = raw.match(/\[(.*?)\]/);
  const timestamp = tsMatch ? tsMatch[1] : new Date().toLocaleTimeString().split(" ")[0];
  const message = raw.replace(/\[.*?\]\s*\[.*?\]\s*/, "");
  const isAnomaly = isMonitorAnomaly(level, message);
  const anomalyId = isAnomaly ? `${timestamp}-${lineIndex}-${message.slice(0, 48)}` : null;

  return {
    id: `${timestamp}-${lineIndex}-${message.slice(0, 64)}`,
    timestamp,
    level,
    message,
    isAnomaly,
    anomalyId,
  };
}
