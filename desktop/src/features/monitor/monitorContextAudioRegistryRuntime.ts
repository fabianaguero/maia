const activeAudioElements = new Set<HTMLAudioElement>();

export function registerActiveAudioElement(audio: HTMLAudioElement): void {
  activeAudioElements.add(audio);
}

export function unregisterActiveAudioElement(audio: HTMLAudioElement): void {
  activeAudioElements.delete(audio);
}

export function stopAllMonitorAudio(): void {
  activeAudioElements.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
  });
  activeAudioElements.clear();
}
