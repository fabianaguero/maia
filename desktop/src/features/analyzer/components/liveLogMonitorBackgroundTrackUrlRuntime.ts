import type { LibraryTrack } from "../../../types/library";
import { resolvePlayableTrackPath } from "../../../utils/track";

export function resolveBackgroundTrackUrl(input: {
  track: LibraryTrack;
  isTauriRuntime: boolean;
  convertFileSrc: (path: string) => string;
}): string | null {
  const audioPath = resolvePlayableTrackPath(input.track);
  if (!audioPath) {
    return null;
  }

  if (!input.isTauriRuntime) {
    return audioPath;
  }

  try {
    return input.convertFileSrc(audioPath);
  } catch {
    return null;
  }
}
