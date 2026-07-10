import { GitBranch } from "lucide-react";
import { RuntimeStatusCard } from "../../../components/RuntimeStatusCard";

interface ImportRepositoryActionsFooterProps {
  busy: boolean;
  analyzingLabel: string;
  startIngestionLabel: string;
  defaultDirectoryPath?: string;
  useCurrentWorkspaceLabel: string;
  onUseCurrentWorkspace: () => void;
}

export function ImportRepositoryActionsFooter({
  busy,
  analyzingLabel,
  startIngestionLabel,
  defaultDirectoryPath,
  useCurrentWorkspaceLabel,
  onUseCurrentWorkspace,
}: ImportRepositoryActionsFooterProps) {
  return (
    <div className="form-actions-footer">
      {busy ? (
        <RuntimeStatusCard
          title={analyzingLabel}
          detail={startIngestionLabel}
          badge={analyzingLabel}
          tone="pending"
          activity="spinner"
          compact
          className="form-runtime-status"
        />
      ) : null}
      <button type="submit" className="action primary-launch-btn" disabled={busy}>
        <>
          <GitBranch size={16} /> {busy ? analyzingLabel : startIngestionLabel}
        </>
      </button>

      {defaultDirectoryPath && (
        <button
          type="button"
          className="secondary-action glass-btn"
          disabled={busy}
          onClick={onUseCurrentWorkspace}
        >
          {useCurrentWorkspaceLabel}
        </button>
      )}
    </div>
  );
}
