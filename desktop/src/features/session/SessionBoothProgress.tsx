interface SessionBoothProgressProps {
  visible: boolean;
  progressAriaLabel: string;
  progressWidth: string;
}

export function SessionBoothProgress({
  visible,
  progressAriaLabel,
  progressWidth,
}: SessionBoothProgressProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="session-booth-progress" aria-label={progressAriaLabel}>
      <span
        style={{
          width: progressWidth,
        }}
      />
    </div>
  );
}
