export function resolveManagedAudioSourceState(input: {
  audioPath: string | null;
  isTauriRuntime: boolean;
  convertFileSrc: (path: string) => string;
}): string | null {
  if (!input.audioPath) {
    return null;
  }

  if (input.audioPath.startsWith("browser-fallback://") || input.audioPath.startsWith("http")) {
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
