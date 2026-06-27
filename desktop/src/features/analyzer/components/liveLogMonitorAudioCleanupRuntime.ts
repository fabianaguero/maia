import type { MutableRefObject } from "react";

interface DisconnectableAudioNode {
  disconnect: () => void;
}

interface StopLiveMonitorAudioGraphInput {
  stopBackgroundDeck: () => void;
  stopBeatLooper: () => void;
  muteManagedBlobAudio: () => void;
  backgroundGainRef: MutableRefObject<DisconnectableAudioNode | null>;
  backgroundDryGainRef: MutableRefObject<DisconnectableAudioNode | null>;
  backgroundDriveWetGainRef: MutableRefObject<DisconnectableAudioNode | null>;
  backgroundDriveNodeRef: MutableRefObject<DisconnectableAudioNode | null>;
  filterNodeRef: MutableRefObject<DisconnectableAudioNode | null>;
  masterGainRef: MutableRefObject<DisconnectableAudioNode | null>;
  analyserRef: MutableRefObject<DisconnectableAudioNode | null>;
}

function disconnectNodeRef(
  ref: MutableRefObject<DisconnectableAudioNode | null>,
): void {
  if (!ref.current) {
    return;
  }

  ref.current.disconnect();
  ref.current = null;
}

export function stopLiveMonitorAudioGraph(input: StopLiveMonitorAudioGraphInput): void {
  input.stopBeatLooper();
  input.stopBackgroundDeck();

  disconnectNodeRef(input.backgroundGainRef);
  disconnectNodeRef(input.backgroundDryGainRef);
  disconnectNodeRef(input.backgroundDriveWetGainRef);
  disconnectNodeRef(input.backgroundDriveNodeRef);
  disconnectNodeRef(input.filterNodeRef);
  disconnectNodeRef(input.masterGainRef);

  input.muteManagedBlobAudio();

  disconnectNodeRef(input.analyserRef);
}
