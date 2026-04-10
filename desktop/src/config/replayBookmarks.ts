export interface ReplayBookmarkTagOption {
  id: string;
  label: string;
  description: string;
}

export const REPLAY_BOOKMARK_TAGS: ReplayBookmarkTagOption[] = [
  {
    id: "good-alerting",
    label: "Good alerting",
    description: "The team could hear important changes clearly without breaking the groove.",
  },
  {
    id: "too-noisy",
    label: "Too noisy",
    description: "This window pushed the mix too hard for background listening.",
  },
  {
    id: "deploy-transition",
    label: "Deploy transition",
    description: "Useful transition feel for deploys, releases, or cutovers.",
  },
  {
    id: "smooth-bed",
    label: "Smooth bed",
    description: "Steady background bed worth reusing for quieter monitoring windows.",
  },
  {
    id: "needs-space",
    label: "Needs space",
    description: "Good shape, but the mutation layer needs more room around the base track.",
  },
];

export function resolveReplayBookmarkTagLabel(
  bookmarkTag: string | null | undefined,
): string | null {
  if (!bookmarkTag) {
    return null;
  }

  return (
    REPLAY_BOOKMARK_TAGS.find((entry) => entry.id === bookmarkTag)?.label ?? bookmarkTag
  );
}
