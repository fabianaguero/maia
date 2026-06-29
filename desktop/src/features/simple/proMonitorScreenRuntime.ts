import type { AppTranslations } from "../../i18n/en";
import type {
  ProMonitorBookmark,
  ProMonitorLogLine,
  ProMonitorMockData,
} from "./proMonitorMockData";

export interface ProMonitorLogLineViewModel extends ProMonitorLogLine {
  levelBadgeClassName: string;
  levelLabel: string;
}

export interface ProMonitorBookmarkViewModel extends ProMonitorBookmark {
  tagLabel: string;
}

export interface ProMonitorScreenViewModel {
  mockData: ProMonitorMockData;
  logLines: ProMonitorLogLineViewModel[];
  bookmarks: ProMonitorBookmarkViewModel[];
}

export function resolveProMonitorBookmarkTag(
  t: AppTranslations,
  bookmark: ProMonitorBookmark,
): string {
  switch (bookmark.tagKind) {
    case "spike":
      return t.simpleMode.proMonitor.tagSpike;
    case "anomaly":
      return t.simpleMode.proMonitor.tagAnomaly;
    case "recovery":
      return t.simpleMode.proMonitor.tagRecovery;
    default:
      return t.simpleMode.proMonitor.tagCustom;
  }
}

export function resolveProMonitorLevelBadgeClass(level: ProMonitorLogLine["level"]): string {
  switch (level) {
    case "warn":
      return "badge-warn";
    case "error":
      return "badge-error";
    case "info":
    default:
      return "badge-info";
  }
}

export function createCustomProMonitorBookmark(nowMs = Date.now()): ProMonitorBookmark {
  return {
    id: String(nowMs),
    timestamp: "09:15:00",
    tagKind: "custom",
  };
}

export function buildProMonitorScreenViewModel(input: {
  t: AppTranslations;
  mockData: ProMonitorMockData;
  bookmarks: ProMonitorBookmark[];
}): ProMonitorScreenViewModel {
  return {
    mockData: input.mockData,
    logLines: input.mockData.logLines.map((line) => ({
      ...line,
      levelBadgeClassName: resolveProMonitorLevelBadgeClass(line.level),
      levelLabel: line.level.toUpperCase(),
    })),
    bookmarks: input.bookmarks.map((bookmark) => ({
      ...bookmark,
      tagLabel: resolveProMonitorBookmarkTag(input.t, bookmark),
    })),
  };
}
