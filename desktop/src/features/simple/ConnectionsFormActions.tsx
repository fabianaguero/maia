import { Cable, X } from "lucide-react";

interface ConnectionsFormActionsProps {
  primaryActionLabel: string;
  cancelLabel: string;
  canCancel: boolean;
  saving: boolean;
  loading: boolean;
  onSaveConnection: () => void | Promise<void>;
  onCancelEdit: () => void;
}

export function ConnectionsFormActions({
  primaryActionLabel,
  cancelLabel,
  canCancel,
  saving,
  loading,
  onSaveConnection,
  onCancelEdit,
}: ConnectionsFormActionsProps) {
  return (
    <div className="form-actions-footer">
      <button
        type="button"
        className="action primary-launch-btn"
        disabled={saving || loading}
        onClick={() => void onSaveConnection()}
      >
        <Cable size={16} />
        {` ${primaryActionLabel}`}
      </button>
      {canCancel ? (
        <button type="button" className="card-action-btn" disabled={saving} onClick={onCancelEdit}>
          <X size={14} />
          {cancelLabel}
        </button>
      ) : null}
    </div>
  );
}
