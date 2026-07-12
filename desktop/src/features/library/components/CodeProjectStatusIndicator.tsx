import { Loader2 } from "lucide-react";
import { useT } from "../../../i18n/I18nContext";
import {
  resolveCodeProjectStatusClass,
  resolveCodeProjectStatusLabel,
} from "../codeProjectsViewModel";
import "./CodeProjectStatusIndicator.css";

interface CodeProjectStatusIndicatorProps {
  status: "not-configured" | "testing" | "ready" | "error";
  errorMessage?: string;
  issueCount?: number;
  lastCheckedAt?: string;
}

export function CodeProjectStatusIndicator({
  status,
  errorMessage,
  issueCount,
  lastCheckedAt,
}: CodeProjectStatusIndicatorProps) {
  const t = useT();
  const label = resolveCodeProjectStatusLabel(status, t);
  const statusClass = resolveCodeProjectStatusClass(status);

  const title = lastCheckedAt
    ? `Last checked: ${new Date(lastCheckedAt).toLocaleString()}`
    : undefined;

  return (
    <div className={`status-badge ${statusClass}`} title={title}>
      {status === "testing" && <Loader2 size={14} className="spinner" />}
      <span className="status-label">
        {label}
        {status === "ready" && issueCount !== undefined && (
          <span className="issue-count"> • {issueCount} issues</span>
        )}
      </span>
      {status === "error" && errorMessage && <div className="error-tooltip">{errorMessage}</div>}
    </div>
  );
}
