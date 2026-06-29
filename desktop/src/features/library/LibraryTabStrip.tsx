import { Cable, FolderOpen, Music, PackagePlus } from "lucide-react";

import type { LibraryTabViewModel } from "./libraryScreenViewModel";
import type { LibraryTab } from "./libraryScreenTypes";

interface LibraryTabStripProps {
  tabs: LibraryTabViewModel[];
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
}

function renderTabIcon(tab: LibraryTab) {
  if (tab === "tracks") {
    return <Music size={14} />;
  }
  if (tab === "sources") {
    return <FolderOpen size={14} />;
  }
  if (tab === "connections") {
    return <Cable size={14} />;
  }
  return <PackagePlus size={14} />;
}

export function LibraryTabStrip({ tabs, activeTab, onTabChange }: LibraryTabStripProps) {
  return (
    <div className="library-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`library-tab${activeTab === tab.id ? " active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {renderTabIcon(tab.id)}
          {tab.label}
          <span className="library-tab-count">{tab.count}</span>
        </button>
      ))}
    </div>
  );
}
