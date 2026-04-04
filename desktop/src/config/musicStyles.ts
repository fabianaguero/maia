import rawCatalog from "./music-styles.json";

import type { MusicStyleCatalog, MusicStyleOption } from "../types/music";

const fallbackCatalog: MusicStyleCatalog = {
  defaultTrackMusicStyleId: "house",
  musicStyles: [
    {
      id: "house",
      label: "House",
      description: "Warm 4x4 club prior for steady groove imports.",
      minBpm: 118,
      maxBpm: 128,
    },
    {
      id: "trance",
      label: "Trance",
      description: "High-lift euphoric prior with faster peak-time momentum.",
      minBpm: 132,
      maxBpm: 140,
    },
    {
      id: "edm",
      label: "EDM",
      description: "Festival-oriented prior for broader hooks and mainstage pacing.",
      minBpm: 126,
      maxBpm: 132,
    },
  ],
};

function normalizeMusicStyle(style: Partial<MusicStyleOption>): MusicStyleOption | null {
  const id = typeof style.id === "string" ? style.id.trim() : "";
  const label = typeof style.label === "string" ? style.label.trim() : "";
  const description =
    typeof style.description === "string" ? style.description.trim() : "";
  const minBpm =
    typeof style.minBpm === "number" && Number.isFinite(style.minBpm)
      ? Math.round(style.minBpm)
      : NaN;
  const maxBpm =
    typeof style.maxBpm === "number" && Number.isFinite(style.maxBpm)
      ? Math.round(style.maxBpm)
      : NaN;

  if (!id || !label || !description || !Number.isFinite(minBpm) || !Number.isFinite(maxBpm)) {
    return null;
  }

  return {
    id,
    label,
    description,
    minBpm: Math.min(minBpm, maxBpm),
    maxBpm: Math.max(minBpm, maxBpm),
  };
}

function normalizeCatalog(input: Partial<MusicStyleCatalog>): MusicStyleCatalog {
  const musicStyles = Array.isArray(input.musicStyles)
    ? input.musicStyles
        .map((style) => normalizeMusicStyle(style))
        .filter((style): style is MusicStyleOption => style !== null)
    : [];

  if (musicStyles.length === 0) {
    return fallbackCatalog;
  }

  const preferredDefaultId =
    typeof input.defaultTrackMusicStyleId === "string"
      ? input.defaultTrackMusicStyleId.trim()
      : "";
  const defaultTrackMusicStyleId = musicStyles.some(
    (style) => style.id === preferredDefaultId,
  )
    ? preferredDefaultId
    : musicStyles[0].id;

  return {
    defaultTrackMusicStyleId,
    musicStyles,
  };
}

export const musicStyleCatalog = normalizeCatalog(rawCatalog);

export function resolveMusicStyle(id: string | null | undefined): MusicStyleOption | null {
  if (!id) {
    return null;
  }

  return musicStyleCatalog.musicStyles.find((style) => style.id === id) ?? null;
}

export function fallbackMusicStyleLabel(id: string | null | undefined): string {
  const resolved = resolveMusicStyle(id);
  if (resolved) {
    return resolved.label;
  }

  return id?.trim() ? id : "Not set";
}
