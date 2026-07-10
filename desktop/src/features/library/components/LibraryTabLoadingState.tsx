import { RuntimeStatusCard } from "../../../components/RuntimeStatusCard";

interface LibraryTabLoadingStateProps {
  loadingLabel: string;
}

export function LibraryTabLoadingState({ loadingLabel }: LibraryTabLoadingStateProps) {
  return (
    <RuntimeStatusCard
      title={loadingLabel}
      badge={loadingLabel}
      tone="pending"
      activity="spinner"
      compact
      className="placeholder-loading placeholder-loading--runtime"
    />
  );
}
