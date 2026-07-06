interface LibraryTabLoadingStateProps {
  loadingLabel: string;
}

export function LibraryTabLoadingState({ loadingLabel }: LibraryTabLoadingStateProps) {
  return (
    <div className="placeholder-loading">
      <span className="spin-ring" aria-hidden="true" />
      {loadingLabel}
    </div>
  );
}
