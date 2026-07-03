import type { GenreProfile } from "./liveSonificationSceneProfileData";
import { ACOUSTIC_GENRE_PROFILES } from "./liveSonificationAcousticGenreProfileData";
import { DANCE_GENRE_PROFILES } from "./liveSonificationDanceGenreProfileData";

export const GENRE_PROFILES: Record<string, GenreProfile> = {
  ...DANCE_GENRE_PROFILES,
  ...ACOUSTIC_GENRE_PROFILES,
};
