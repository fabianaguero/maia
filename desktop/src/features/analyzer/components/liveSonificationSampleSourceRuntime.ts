import type { BaseAssetRecord, CompositionResultRecord, LiveLogCue } from "../../../types/library";
import type { SceneRouteKey } from "./liveSonificationSceneTypes";

const PLAYABLE_AUDIO_EXTENSIONS = new Set([
  ".wav",
  ".mp3",
  ".flac",
  ".ogg",
  ".oga",
  ".aif",
  ".aiff",
  ".m4a",
  ".aac",
  ".mp4",
]);

function fileExtension(path: string | null | undefined): string {
  if (!path) {
    return "";
  }

  const cleaned = path.trim().toLowerCase();
  const dotIndex = cleaned.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }

  return cleaned.slice(dotIndex);
}

export function isPlayableAudioPath(path: string | null | undefined): boolean {
  return PLAYABLE_AUDIO_EXTENSIONS.has(fileExtension(path));
}

function metricPreviewEntries(baseAsset: BaseAssetRecord | null): string[] {
  const raw = baseAsset?.metrics.previewEntries;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === "string");
}

function metricPlayableAudioEntries(baseAsset: BaseAssetRecord | null): string[] {
  const raw = baseAsset?.metrics.playableAudioEntries;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === "string");
}

export function joinManagedPath(rootPath: string, relativeEntry: string): string {
  const separator = rootPath.includes("\\") ? "\\" : "/";
  const trimmedRoot = rootPath.replace(/[\\/]+$/, "");
  const normalizedEntry = relativeEntry.replace(/[\\/]+/g, separator);
  return `${trimmedRoot}${separator}${normalizedEntry}`;
}

export function resolveSceneSampleSources(
  baseAsset: BaseAssetRecord | null,
  composition: CompositionResultRecord | null,
): {
  sources: Array<{ path: string; label: string }>;
  mode: "single-sample" | "multi-sample" | "synth";
  detail: string;
} {
  if (baseAsset && !baseAsset.storagePath.startsWith("browser-fallback://")) {
    if (baseAsset.sourceKind === "file" && isPlayableAudioPath(baseAsset.storagePath)) {
      return {
        sources: [{ path: baseAsset.storagePath, label: baseAsset.title }],
        mode: "single-sample",
        detail: "Live cues trigger the managed base-asset file directly.",
      };
    }

    if (baseAsset.sourceKind === "directory") {
      const playableEntries = [
        ...metricPlayableAudioEntries(baseAsset),
        ...metricPreviewEntries(baseAsset),
      ].filter(
        (entry, index, entries) => isPlayableAudioPath(entry) && entries.indexOf(entry) === index,
      );

      if (playableEntries.length > 0) {
        const sources = playableEntries.slice(0, 4).map((entry) => ({
          path: joinManagedPath(baseAsset.storagePath, entry),
          label: entry,
        }));

        return {
          sources,
          mode: sources.length === 1 ? "single-sample" : "multi-sample",
          detail:
            sources.length === 1
              ? "Live cues use the only playable entry from the managed base-asset folder."
              : "Live cues distribute across multiple playable entries from the managed base-asset folder.",
        };
      }
    }
  }

  if (
    composition?.previewAudioPath &&
    !composition.previewAudioPath.startsWith("browser-fallback://") &&
    isPlayableAudioPath(composition.previewAudioPath)
  ) {
    return {
      sources: [{ path: composition.previewAudioPath, label: composition.title }],
      mode: "single-sample",
      detail: "Live cues trigger the composition preview WAV — hybrid mixer mode.",
    };
  }

  return {
    sources: [],
    mode: "synth",
    detail: "No playable managed audio found; live cues stay on internal synthesis.",
  };
}

export function routeSampleAssignment(
  sampleSources: Array<{ path: string; label: string }>,
  routeKey: SceneRouteKey,
): { samplePath: string | null; sampleLabel: string | null } {
  if (sampleSources.length === 0) {
    return { samplePath: null, sampleLabel: null };
  }

  if (sampleSources.length === 1) {
    const onlySource = sampleSources[0];
    return onlySource
      ? { samplePath: onlySource.path, sampleLabel: onlySource.label }
      : { samplePath: null, sampleLabel: null };
  }

  const index =
    routeKey === "info"
      ? 0
      : routeKey === "warn"
        ? Math.min(1, sampleSources.length - 1)
        : routeKey === "error"
          ? Math.min(2, sampleSources.length - 1)
          : sampleSources.length - 1;

  const selected = sampleSources[index] ?? sampleSources[0];
  return selected
    ? { samplePath: selected.path, sampleLabel: selected.label }
    : { samplePath: null, sampleLabel: null };
}

export function routeKeyForCue(cue: LiveLogCue): SceneRouteKey {
  if (cue.accent === "anomaly") {
    return "anomaly";
  }
  if (cue.level === "error") {
    return "error";
  }
  if (cue.level === "warn") {
    return "warn";
  }
  return "info";
}
