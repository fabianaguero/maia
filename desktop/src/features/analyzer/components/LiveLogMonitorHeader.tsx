interface BounceAction {
  label: string;
  title: string;
}

interface LiveLogMonitorHeaderProps {
  title: string;
  subtitle: string;
  deckStatusLabel: string;
  activeAdapterLabel: string;
  audioBadgeTone: string;
  audioBadgeLabel: string;
  audioBadgeTitle: string;
  testAudioLabel: string;
  liveEnabled: boolean;
  stopLabel: string;
  bounceAction: BounceAction | null;
  onEnsureAudioReady: () => void | Promise<void>;
  onPlayTestTone: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
  onBounce: () => void | Promise<void>;
}

export function LiveLogMonitorHeader({
  title,
  subtitle,
  deckStatusLabel,
  activeAdapterLabel,
  audioBadgeTone,
  audioBadgeLabel,
  audioBadgeTitle,
  testAudioLabel,
  liveEnabled,
  stopLabel,
  bounceAction,
  onEnsureAudioReady,
  onPlayTestTone,
  onStop,
  onBounce,
}: LiveLogMonitorHeaderProps) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p className="support-copy">{subtitle}</p>
      </div>
      <div className="live-log-toolbar">
        <span className={`live-log-badge ${liveEnabled ? "live" : "idle"}`}>{deckStatusLabel}</span>
        <span className="live-log-badge">{activeAdapterLabel}</span>
        <span
          className={`live-log-badge ${audioBadgeTone}`}
          title={audioBadgeTitle}
          onClick={() => void onEnsureAudioReady()}
          style={{ cursor: "pointer" }}
        >
          {audioBadgeLabel}
        </span>
        <button type="button" className="secondary-action" onClick={() => void onPlayTestTone()}>
          {testAudioLabel}
        </button>
        {liveEnabled ? (
          <button type="button" className="secondary-action" onClick={() => void onStop()}>
            {stopLabel}
          </button>
        ) : null}
        {bounceAction ? (
          <button
            type="button"
            className="secondary-action"
            onClick={() => void onBounce()}
            title={bounceAction.title}
          >
            {bounceAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
