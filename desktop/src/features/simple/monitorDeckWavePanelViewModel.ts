import type { AppTranslations } from "../../i18n/types";

export interface MonitorDeckWaveOverviewViewModel {
  label: string;
  sublabel: string;
}

export interface MonitorDeckWaveLaneViewModel {
  key: string;
  label: string;
  title: string;
  tone: "track" | "log";
}

export interface MonitorDeckWavePanelViewModel {
  overview: MonitorDeckWaveOverviewViewModel;
  laneLabels: MonitorDeckWaveLaneViewModel[];
}

export function buildMonitorDeckWavePanelViewModel(input: {
  t: AppTranslations;
}): MonitorDeckWavePanelViewModel {
  return {
    overview: {
      label: input.t.simpleMode.monitor.fullTrackMap,
      sublabel: input.t.simpleMode.monitor.overviewHeatMap,
    },
    laneLabels: [
      {
        key: "track",
        label: input.t.simpleMode.monitor.trackLaneCompact,
        title: input.t.simpleMode.monitor.upperLane,
        tone: "track",
      },
      {
        key: "log",
        label: input.t.simpleMode.monitor.logLaneCompact,
        title: input.t.simpleMode.monitor.lowerLane,
        tone: "log",
      },
    ],
  };
}
