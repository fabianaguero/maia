import { FolderOpen, Music, Package } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import type { ProLibraryTabId } from "./proLibraryScreenRuntime";

interface ProLibraryTabsProps {
  activeTab: ProLibraryTabId;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  t: AppTranslations;
  onSelectTab: (tab: ProLibraryTabId) => void;
}

export function ProLibraryTabs({
  activeTab,
  trackCount,
  repositoryCount,
  baseAssetCount,
  t,
  onSelectTab,
}: ProLibraryTabsProps) {
  return (
    <div className="library-tabs">
      <button
        className={`tab ${activeTab === "sounds" ? "active" : ""}`}
        onClick={() => onSelectTab("sounds")}
      >
        <Music size={16} />
        {t.library.sounds}
        <span className="tab-count">{trackCount}</span>
      </button>
      <button
        className={`tab ${activeTab === "sources" ? "active" : ""}`}
        onClick={() => onSelectTab("sources")}
      >
        <FolderOpen size={16} />
        {t.library.logSources}
        <span className="tab-count">{repositoryCount}</span>
      </button>
      <button
        className={`tab ${activeTab === "profiles" ? "active" : ""}`}
        onClick={() => onSelectTab("profiles")}
      >
        <Package size={16} />
        {t.library.profiles}
        <span className="tab-count">{baseAssetCount}</span>
      </button>
    </div>
  );
}
