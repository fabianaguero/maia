import type { LiveLogStreamUpdate } from "../../../types/library";

export interface BackgroundMutationProfile {
  filterHz: number;
  filterQ: number;
  busGain: number;
  deckGain: number;
  driveWet: number;
  playbackRate: number;
  gateDepth: number;
  gatePulses: number;
  recoverSeconds: number;
}

export type LiveMutationState = "normal" | "warning" | "critical";

export interface ManagedBlobAudioElement {
  volume: number;
  currentTime: number;
  pause: () => void;
  play: () => Promise<unknown>;
  addEventListener: (
    type: string,
    listener: () => void,
    options?: AddEventListenerOptions,
  ) => void;
}

export interface ManagedBlobAudioRuntimeLogger {
  warn: (message: string, ...args: unknown[]) => void;
}

export function createDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const drive = Math.max(0.1, amount);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.tanh(x * drive);
  }
  return curve as Float32Array<ArrayBuffer>;
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function resolveBackgroundMutationProfile(
  update: LiveLogStreamUpdate,
  styleBackgroundGain: number,
  styleFilterBaseHz: number,
  styleFilterCeilingHz: number,
  mutationProfile: {
    backgroundDucking: number;
    filterSweepMultiplier: number;
    anomalyBoostMultiplier: number;
    transitionTightness: number;
  },
): BackgroundMutationProfile {
  const lineCount = Math.max(1, update.lineCount);
  const warnCount = update.levelCounts["WARN"] ?? update.levelCounts.warn ?? 0;
  const errorCount = update.levelCounts["ERROR"] ?? update.levelCounts.error ?? 0;
  const anomalyRatio = clamp01(update.anomalyCount / lineCount);
  const severityRatio = clamp01((warnCount * 0.45 + errorCount) / lineCount);
  const densityRatio = clamp01(lineCount / 18);
  const pressure = clamp01(
    anomalyRatio * mutationProfile.anomalyBoostMultiplier * 0.55 +
      severityRatio * 0.3 +
      densityRatio * 0.15,
  );
  const filterFloor = Math.max(
    180,
    styleFilterBaseHz / Math.max(1, mutationProfile.filterSweepMultiplier),
  );
  const recoverSeconds = 0.9 + (1.25 - Math.min(1, mutationProfile.transitionTightness)) * 0.8;

  return {
    filterHz: Math.max(
      filterFloor,
      styleFilterCeilingHz - (styleFilterCeilingHz - filterFloor) * pressure,
    ),
    filterQ: 1 + pressure * 8,
    busGain: Math.max(
      0.14,
      styleBackgroundGain - mutationProfile.backgroundDucking * (0.45 + pressure * 0.85),
    ),
    deckGain: Math.max(0.18, 1 - pressure * 0.42),
    driveWet: clamp01(pressure * 0.82),
    playbackRate: 1 - pressure * 0.045,
    gateDepth: pressure > 0.18 ? Math.min(0.68, 0.12 + pressure * 0.56) : 0,
    gatePulses: pressure > 0.72 ? 3 : pressure > 0.36 ? 2 : pressure > 0.18 ? 1 : 0,
    recoverSeconds,
  };
}

export function resolveLiveMutationState(
  mutation: BackgroundMutationProfile,
): LiveMutationState {
  if (mutation.driveWet >= 0.58 || mutation.gatePulses >= 2) {
    return "critical";
  }
  if (mutation.driveWet >= 0.22 || mutation.gatePulses >= 1) {
    return "warning";
  }
  return "normal";
}

export function forceBackgroundMutationProfile(
  state: LiveMutationState,
  styleProfile: {
    backgroundGain: number;
    filterBaseHz: number;
    filterCeilingHz: number;
  },
): BackgroundMutationProfile {
  if (state === "critical") {
    return {
      filterHz: Math.max(170, styleProfile.filterBaseHz * 0.82),
      filterQ: 9.4,
      busGain: Math.max(0.12, styleProfile.backgroundGain * 0.42),
      deckGain: 0.52,
      driveWet: 0.86,
      playbackRate: 0.94,
      gateDepth: 0.66,
      gatePulses: 4,
      recoverSeconds: 1.28,
    };
  }
  if (state === "warning") {
    return {
      filterHz: Math.max(230, styleProfile.filterCeilingHz * 0.48),
      filterQ: 4.6,
      busGain: Math.max(0.17, styleProfile.backgroundGain * 0.7),
      deckGain: 0.78,
      driveWet: 0.36,
      playbackRate: 0.975,
      gateDepth: 0.24,
      gatePulses: 1,
      recoverSeconds: 1.02,
    };
  }
  return {
    filterHz: Math.min(styleProfile.filterCeilingHz * 1.02, 22000),
    filterQ: 1,
    busGain: styleProfile.backgroundGain,
    deckGain: 1,
    driveWet: 0,
    playbackRate: 1,
    gateDepth: 0,
    gatePulses: 0,
    recoverSeconds: 0.75,
  };
}

export function createManagedBlobAudioRegistry(): Set<ManagedBlobAudioElement> {
  return new Set<ManagedBlobAudioElement>();
}

export function setBlobAudioVolumeState(
  activeBlobAudioElements: Set<ManagedBlobAudioElement>,
  volume: number,
): void {
  const nextVolume = Math.max(0, Math.min(1, volume));
  activeBlobAudioElements.forEach((audio) => {
    audio.volume = nextVolume;
  });
}

export function stopManagedBlobAudioState(
  activeBlobAudioElements: Set<ManagedBlobAudioElement>,
): void {
  activeBlobAudioElements.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeBlobAudioElements.clear();
}

export function playManagedWavBlobState(input: {
  blob: Blob;
  volume: number;
  activeBlobAudioElements: Set<ManagedBlobAudioElement>;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  createAudio: (url: string) => ManagedBlobAudioElement;
  setTimeoutFn: (handler: () => void, timeout: number) => unknown;
  logger: ManagedBlobAudioRuntimeLogger;
}): void {
  const url = input.createObjectUrl(input.blob);
  const audio = input.createAudio(url);
  audio.volume = Math.max(0, Math.min(1, input.volume));
  input.activeBlobAudioElements.add(audio);

  const cleanup = () => {
    input.activeBlobAudioElements.delete(audio);
    input.revokeObjectUrl(url);
  };

  audio.addEventListener("ended", cleanup, { once: true });
  void audio.play().catch((error) => {
    input.logger.warn("[Maia Audio] WAV playback failed:", error);
    cleanup();
  });

  input.setTimeoutFn(() => {
    if (input.activeBlobAudioElements.has(audio)) {
      input.activeBlobAudioElements.delete(audio);
      input.revokeObjectUrl(url);
    }
  }, 5000);
}

export function resolveManagedAudioSourceState(input: {
  audioPath: string | null;
  isTauriRuntime: boolean;
  convertFileSrc: (path: string) => string;
}): string | null {
  if (!input.audioPath) {
    return null;
  }

  if (
    input.audioPath.startsWith("browser-fallback://") ||
    input.audioPath.startsWith("http")
  ) {
    return input.audioPath.replace("browser-fallback://", "");
  }

  if (!input.isTauriRuntime) {
    return input.audioPath.startsWith("/") ? input.audioPath : `./${input.audioPath}`;
  }

  try {
    return input.convertFileSrc(input.audioPath);
  } catch {
    return null;
  }
}
