import { RuntimeStatusCard } from "./RuntimeStatusCard";

interface ScreenBusyOverlayProps {
  visible: boolean;
  title: string;
  detail?: string;
  badge?: string;
}

export function ScreenBusyOverlay({ visible, title, detail, badge }: ScreenBusyOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="screen-busy-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="screen-busy-overlay__scrim" />
      <div className="screen-busy-overlay__content">
        <RuntimeStatusCard
          title={title}
          detail={detail}
          badge={badge}
          tone="pending"
          activity="spinner"
          className="screen-busy-overlay__card"
        />
      </div>
    </div>
  );
}
