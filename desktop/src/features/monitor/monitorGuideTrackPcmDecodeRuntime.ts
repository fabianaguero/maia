import { RENDER_SAMPLE_RATE, type GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { GuideTrackDecodeDependencies } from "./monitorGuideTrackDecodeTypes";

export async function decodeGuideTrackPcm(input: {
  arrayBuffer: ArrayBuffer;
  dependencies: GuideTrackDecodeDependencies;
}): Promise<GuideTrackPCM> {
  const offlineContext = input.dependencies.createOfflineAudioContext(
    1,
    RENDER_SAMPLE_RATE * 600,
    RENDER_SAMPLE_RATE,
  );
  const audioBuffer = await offlineContext.decodeAudioData(input.arrayBuffer);
  const mono = new Float32Array(audioBuffer.length);
  const firstChannel = audioBuffer.getChannelData(0);

  if (audioBuffer.numberOfChannels >= 2) {
    const secondChannel = audioBuffer.getChannelData(1);
    for (let index = 0; index < mono.length; index += 1) {
      mono[index] = (firstChannel[index] + secondChannel[index]) * 0.5;
    }
  } else {
    mono.set(firstChannel);
  }

  const durationSec = mono.length / audioBuffer.sampleRate;
  input.dependencies.logger.info(
    "decoded mono PCM: %d samples, %ss @ %dHz",
    mono.length,
    durationSec.toFixed(2),
    audioBuffer.sampleRate,
  );

  return {
    samples: mono,
    sampleRate: audioBuffer.sampleRate,
    durationSec,
  };
}
