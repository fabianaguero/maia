import type { AppTranslations } from "../../i18n/en";

export interface MonitorFooterStatusPillViewModel {
  key: string;
  label: string;
  value: string;
  tone: "default" | "live" | "muted";
}

export interface MonitorFooterActionViewModel {
  key: string;
  label: string;
  tone: "primary" | "secondary";
}

export interface MonitorFooterViewModel {
  statusPills: MonitorFooterStatusPillViewModel[];
  actions: MonitorFooterActionViewModel[];
}

export function buildMonitorFooterViewModel(input: {
  t: AppTranslations;
  streamStatusLabel: string;
  audioStatusLabel: string;
  audioStatusTone: "live" | "muted";
  audioStatus: AudioContextState;
}): MonitorFooterViewModel {
  return {
    statusPills: [
      {
        key: "stream",
        label: input.t.simpleMode.monitor.logEngine,
        value: input.streamStatusLabel,
        tone: "default",
      },
      {
        key: "audio",
        label: input.t.simpleMode.monitor.audioEngine,
        value: input.audioStatusLabel,
        tone: input.audioStatusTone,
      },
    ],
    actions: [
      {
        key: "audio",
        label:
          input.audioStatus === "running"
            ? input.t.simpleMode.common.audioActive
            : input.t.simpleMode.common.resumeAudio,
        tone: "primary",
      },
    ],
  };
}
