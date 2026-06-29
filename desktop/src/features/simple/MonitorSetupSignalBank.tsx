import type { MonitorSetupSignalViewModel } from "./monitorSetupViewModel";
import { MonitorSetupBankFrame } from "./MonitorSetupBankFrame";

interface MonitorSetupSignalBankProps {
  kicker: string;
  title: string;
  hint: string;
  description: string;
  cards: MonitorSetupSignalViewModel[];
  role?: "list" | "group";
}

export function MonitorSetupSignalBank({
  kicker,
  title,
  hint,
  description,
  cards,
  role,
}: MonitorSetupSignalBankProps) {
  return (
    <MonitorSetupBankFrame
      kicker={kicker}
      title={title}
      hint={hint}
      description={description}
      contentClassName="monitor-setup-screen__signal-cards"
    >
      {cards.map((card) => (
        <div
          key={card.key}
          className="monitor-setup-screen__signal-card"
          role={role === "list" ? "listitem" : undefined}
        >
          <span className="monitor-setup-screen__signal-label">{card.label}</span>
          <strong className="monitor-setup-screen__signal-value">{card.value}</strong>
        </div>
      ))}
    </MonitorSetupBankFrame>
  );
}
