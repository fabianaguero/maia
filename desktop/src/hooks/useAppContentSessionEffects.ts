import { useEffect } from "react";

interface UseAppContentSessionEffectsInput {
  screen: "library" | "inspect" | "compose" | "session";
  refreshSessionBookmarks: () => Promise<unknown>;
}

export function useAppContentSessionEffects({
  screen,
  refreshSessionBookmarks,
}: UseAppContentSessionEffectsInput) {
  useEffect(() => {
    if (screen === "session") {
      void refreshSessionBookmarks();
    }
  }, [refreshSessionBookmarks, screen]);
}
