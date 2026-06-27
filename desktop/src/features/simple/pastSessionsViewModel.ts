import type { PersistedSession } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/en";
import { resolveSessionStatusLabel } from "../../utils/monitorLabels";
import { getBasename, truncateMiddle } from "./monitorDisplay";
import { formatSessionLineCount, formatSessionUpdatedAt, sortMonitorSessions } from "./monitorSessions";

export interface PastSessionRowViewModel {
  id: string;
  name: string;
  trackLabel: string;
  status: PersistedSession["status"];
  statusLabel: string;
  sourcePathLabel: string;
  sourceBasenameLabel: string;
  updatedAtLabel: string;
  totalAnomalies: number;
  lineCountLabel: string;
  replaySourcePath: string;
  replaySourceTitle: string;
}

export interface PastSessionsViewModel {
  title: string;
  emptyStateLabel: string;
  rows: PastSessionRowViewModel[];
}

export function buildPastSessionsViewModel(input: {
  t: AppTranslations;
  sessions: PersistedSession[];
  maxVisible?: number;
}): PastSessionsViewModel {
  const sortedSessions = sortMonitorSessions(input.sessions).slice(0, input.maxVisible ?? 5);

  return {
    title: input.t.simpleMode.setup.pastSessions,
    emptyStateLabel: input.t.simpleMode.setup.noPreviousSessions,
    rows: sortedSessions.map((session) => ({
      id: session.id,
      name: session.label || session.sourceTitle || input.t.simpleMode.common.untitledSession,
      trackLabel: session.trackTitle || input.t.simpleMode.common.noTrack,
      status: session.status,
      statusLabel: resolveSessionStatusLabel(session.status, input.t),
      sourcePathLabel: truncateMiddle(session.sourcePath, 74),
      sourceBasenameLabel: getBasename(session.sourcePath),
      updatedAtLabel: `${input.t.simpleMode.common.updated} ${formatSessionUpdatedAt(session.updatedAt, input.t.locale, input.t.simpleMode.common.justNow)}`,
      totalAnomalies: session.totalAnomalies,
      lineCountLabel: formatSessionLineCount(
        session.totalLines,
        input.t.simpleMode.common.line,
        input.t.simpleMode.common.lines,
      ),
      replaySourcePath: session.sourcePath || "",
      replaySourceTitle: session.sourceTitle || input.t.simpleMode.common.untitledSession,
    })),
  };
}
