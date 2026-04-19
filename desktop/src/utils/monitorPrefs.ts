import {
  DEFAULT_MUTATION_PROFILE_ID,
  DEFAULT_STYLE_PROFILE_ID,
  STYLE_PROFILES,
} from "../config/liveProfiles";
import type { BaseTrackPlaylist } from "../types/library";
import type { ReplayFeedbackRecommendation } from "./replayFeedback";

export interface MonitorPrefs {
  basePlaylist: BaseTrackPlaylist | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  masterVolume?: number;
}

function normalizeBasePlaylist(
  repoId: string,
  basePlaylist: unknown,
): BaseTrackPlaylist | null {
  if (!basePlaylist || typeof basePlaylist !== "object") {
    return null;
  }

  const maybePlaylist = basePlaylist as Partial<BaseTrackPlaylist>;
  if (!Array.isArray(maybePlaylist.trackIds)) {
    return null;
  }

  return {
    id:
      typeof maybePlaylist.id === "string" && maybePlaylist.id.trim()
        ? maybePlaylist.id
        : `playlist-${repoId}`,
    name:
      typeof maybePlaylist.name === "string" && maybePlaylist.name.trim()
        ? maybePlaylist.name
        : "Base playlist",
    trackIds: maybePlaylist.trackIds.filter(
      (trackId): trackId is string => typeof trackId === "string" && trackId.trim().length > 0,
    ),
    createdAt:
      typeof maybePlaylist.createdAt === "string" && maybePlaylist.createdAt
        ? maybePlaylist.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof maybePlaylist.updatedAt === "string" && maybePlaylist.updatedAt
        ? maybePlaylist.updatedAt
        : new Date().toISOString(),
  };
}

export function createBasePlaylist(
  trackIds: string[],
  name = "Base playlist",
): BaseTrackPlaylist {
  const now = new Date().toISOString();
  return {
    id: `playlist-${Math.abs(trackIds.join("|").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0))}`,
    name,
    trackIds,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadMonitorPrefs(repoId: string): MonitorPrefs | null {
  try {
    const raw = localStorage.getItem(`maia.monitor-prefs.${repoId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<MonitorPrefs> & {
      referencePlaylistIds?: string[];
      selectedGenreId?: string;
      selectedPresetId?: string;
    };

    const normalizedBasePlaylist = normalizeBasePlaylist(repoId, parsed.basePlaylist);
    if (normalizedBasePlaylist) {
      return {
        basePlaylist: normalizedBasePlaylist,
        selectedStyleProfileId:
          typeof parsed.selectedStyleProfileId === "string" && parsed.selectedStyleProfileId
            ? parsed.selectedStyleProfileId
            : DEFAULT_STYLE_PROFILE_ID,
        selectedMutationProfileId:
          typeof parsed.selectedMutationProfileId === "string" &&
          parsed.selectedMutationProfileId
            ? parsed.selectedMutationProfileId
            : DEFAULT_MUTATION_PROFILE_ID,
        masterVolume:
          typeof parsed.masterVolume === "number" &&
          Number.isFinite(parsed.masterVolume)
            ? Math.max(0, Math.min(1, parsed.masterVolume))
            : undefined,
      };
    }

    if (Array.isArray(parsed.referencePlaylistIds)) {
      const migratedStyleProfileId =
        STYLE_PROFILES.find(
          (profile) =>
            profile.genreId === parsed.selectedGenreId &&
            profile.presetId === parsed.selectedPresetId,
        )?.id ?? DEFAULT_STYLE_PROFILE_ID;

      return {
        basePlaylist: createBasePlaylist(
          parsed.referencePlaylistIds.filter(
            (trackId): trackId is string =>
              typeof trackId === "string" && trackId.trim().length > 0,
          ),
        ),
        selectedStyleProfileId: migratedStyleProfileId,
        selectedMutationProfileId: DEFAULT_MUTATION_PROFILE_ID,
        masterVolume:
          typeof parsed.masterVolume === "number" &&
          Number.isFinite(parsed.masterVolume)
            ? Math.max(0, Math.min(1, parsed.masterVolume))
            : undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveMonitorPrefs(repoId: string, prefs: MonitorPrefs): void {
  try {
    localStorage.setItem(`maia.monitor-prefs.${repoId}`, JSON.stringify(prefs));
  } catch {
    // ignore quota / private-browsing storage errors
  }
}

export function persistReplayFeedbackRecommendation(
  repoId: string,
  currentPrefs: MonitorPrefs,
  recommendation: Pick<
    ReplayFeedbackRecommendation,
    "suggestedStyleProfileId" | "suggestedMutationProfileId"
  >,
): MonitorPrefs {
  const nextPrefs: MonitorPrefs = {
    ...currentPrefs,
    selectedStyleProfileId: recommendation.suggestedStyleProfileId,
    selectedMutationProfileId: recommendation.suggestedMutationProfileId,
  };

  saveMonitorPrefs(repoId, nextPrefs);
  return nextPrefs;
}
