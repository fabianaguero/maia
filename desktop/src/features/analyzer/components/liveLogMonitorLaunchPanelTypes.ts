export interface LaunchOption {
  id: string;
  label: string;
}

export interface LiveLogMonitorLaunchPanelLabels {
  signalFeedTitle: string;
  weekOnePipeline: string;
  targetLabel: string;
  sceneLaunchTitle: string;
  styleProfileTitle: string;
  mutationProfileTitle: string;
  auditionOverrideTitle: string;
  auditionAuto: string;
  auditionNormal: string;
  auditionWarning: string;
  auditionCritical: string;
  baseBedLabel: string;
  sourceFeedLabel: string;
  cueEngineLabel: string;
  ready: string;
  needsConfig: string;
  recommended: string;
  synthOnlyHint: string;
  auditionOverridePrefix: string;
  liveLogDriven: string;
  forcedStateNormal: string;
  forcedStateWarning: string;
  forcedStateCritical: string;
  startMonitor: string;
  starting: string;
  feedTarget: string;
  configureFeedBeforeStart: string;
  errorPrefix?: string;
}

export interface LiveLogMonitorLaunchPanelProps {
  adapterKind: string;
  adapterLabel: string;
  adapterDescription: string;
  adapterTarget: string;
  fileTailLabel: string;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  selectedStyleLabel: string;
  selectedMutationLabel: string;
  selectedStyleDescription: string;
  selectedMutationDescription: string;
  styleOptions: LaunchOption[];
  mutationOptions: LaunchOption[];
  forcedLiveMutationState: "auto" | "normal" | "warning" | "critical";
  hasBaseListeningBed: boolean;
  baseBedStatusLabel: string;
  adapterConfigured: boolean;
  cueEnginePreviewLabel: string;
  liveMutationStateLabel: string;
  forcedStateDetail: string;
  isStarting: boolean;
  error: string | null;
  labels: LiveLogMonitorLaunchPanelLabels;
  onChangeAdapterKind: (value: string) => void;
  onChangeStyleProfileId: (value: string) => void;
  onChangeMutationProfileId: (value: string) => void;
  onChangeForcedState: (value: "auto" | "normal" | "warning" | "critical") => void;
  onStart: () => void | Promise<void>;
}
