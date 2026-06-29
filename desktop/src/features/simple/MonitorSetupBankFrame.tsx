import type { ReactNode } from "react";

interface MonitorSetupBankFrameProps {
  kicker: string;
  title: string;
  hint: string;
  description: string;
  children: ReactNode;
  contentClassName?: string;
}

export function MonitorSetupBankFrame({
  kicker,
  title,
  hint,
  description,
  children,
  contentClassName,
}: MonitorSetupBankFrameProps) {
  return (
    <div className="monitor-setup-screen__signal-bank">
      <div className="monitor-setup-screen__signal-copy">
        <span className="monitor-setup-screen__rack-kicker">{kicker}</span>
        <strong>{title}</strong>
        <span className="monitor-setup-screen__microcopy" title={description}>
          {hint}
        </span>
      </div>
      <div className={contentClassName ?? "monitor-setup-screen__signal-cards"}>{children}</div>
    </div>
  );
}
