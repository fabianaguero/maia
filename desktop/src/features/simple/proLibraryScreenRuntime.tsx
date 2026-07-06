import type { ReactNode } from "react";

import type { AppTranslations } from "../../i18n/types";

export type ProLibraryTabId = "sounds" | "sources" | "profiles";

export function buildProLibraryStatusBadge(
  status: "analyzed" | "ready" | "pending",
  t: AppTranslations,
): ReactNode {
  const statusClasses: Record<typeof status, string> = {
    analyzed: "badge-analyzed",
    ready: "badge-ready",
    pending: "badge-pending",
  };
  const statusLabels: Record<typeof status, string> = {
    analyzed: t.library.statusAnalyzed,
    ready: t.library.statusReady,
    pending: t.library.statusPending,
  };

  return <span className={`status-badge ${statusClasses[status]}`}>{statusLabels[status]}</span>;
}
