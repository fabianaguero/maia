import type { GenreProfile } from "./liveSonificationSceneProfileData";
import { CLUB_GENRE_PROFILES } from "./liveSonificationClubGenreProfileData";
import { HOUSE_GENRE_PROFILES } from "./liveSonificationHouseGenreProfileData";

export const DANCE_GENRE_PROFILES: Record<string, GenreProfile> = {
  ...HOUSE_GENRE_PROFILES,
  ...CLUB_GENRE_PROFILES,
};
