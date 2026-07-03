import type { MutableRefObject } from "react";

import type { LibraryTrack } from "../../types/library";
import type { ActiveMonitorSession, StreamListener } from "../monitor/monitorContextTypes";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { MonitorLiveStreamHookState } from "./monitorLiveStreamStateTypes";

export interface UseSimpleMonitorDeckLiveControllerInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  deckControls: MonitorDeckControls;
  activeTrack: LibraryTrack | null;
  deckDurationSeconds: number | null;
  session: ActiveMonitorSession | null;
  streamAdapterLabel: string;
  subscribe: (listener: StreamListener) => () => void;
  trackWaveProgressRef: MutableRefObject<number>;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
  liveSettings: MonitorSetupPreferences;
}

export interface SimpleMonitorDeckLiveControllerResult extends MonitorLiveStreamHookState {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  previewTrackId: string | null;
  toggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
}
