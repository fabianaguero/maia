import { GitBranch } from "lucide-react";

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
      <button type="submit" className="action primary-launch-btn" disabled={busy}>
        {busy ? (
          <>
            <span className="spin-ring" aria-hidden="true" /> {analyzingLabel}
          </>
        ) : (
          <>
            <GitBranch size={16} /> {startIngestionLabel}
          </>
        )}
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
