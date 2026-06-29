import { useEffect, useState } from "react";

import type { LibraryTab } from "../features/library/libraryScreenTypes";
import type { AnalyzerViewMode, AppPillar, AppScreen } from "../types/library";

export function useAppContentShellState() {
  const [screen, setScreen] = useState<AppScreen>("library");
  const [pillar, setPillar] = useState<AppPillar>("curate");
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("tracks");
  const [analysisMode, setAnalysisMode] = useState<AnalyzerViewMode>("track");
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [newlyImportedId, setNewlyImportedId] = useState<string | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
    }
  }, [isDark]);

  return {
    screen,
    setScreen,
    pillar,
    setPillar,
    libraryTab,
    setLibraryTab,
    analysisMode,
    setAnalysisMode,
    isDark,
    setIsDark,
    lang,
    setLang,
    newlyImportedId,
    setNewlyImportedId,
  };
}
