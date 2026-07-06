import { RefreshCw } from "lucide-react";

interface ConnectionsRefreshButtonProps {
  title: string;
  disabled: boolean;
  onRefreshConnections: () => void | Promise<void>;
}

export function ConnectionsRefreshButton({
  title,
  disabled,
  onRefreshConnections,
}: ConnectionsRefreshButtonProps) {
  return (
    <button
      type="button"
      className="control-button"
      aria-label={title}
      onClick={() => void onRefreshConnections()}
      disabled={disabled}
      title={title}
    >
      <RefreshCw size={16} />
    </button>
  );
}
