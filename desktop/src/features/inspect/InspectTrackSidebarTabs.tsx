import type { ReactNode } from "react";

import type { InspectTrackTabId, InspectTrackTabViewModel } from "./inspectTrackViewRuntime";

interface InspectTrackSidebarTabsProps {
  tabs: InspectTrackTabViewModel[];
  activeTab: InspectTrackTabId;
  onChangeTab: (tab: InspectTrackTabId) => void;
  overviewPanel: ReactNode;
  gridPanel: ReactNode;
  performancePanel: ReactNode;
  metadataPanel: ReactNode;
  composeCopy: string;
  composeLabel: string;
  onGoCompose: () => void;
}

export function InspectTrackSidebarTabs({
  tabs,
  activeTab,
  onChangeTab,
  overviewPanel,
  gridPanel,
  performancePanel,
  metadataPanel,
  composeCopy,
  composeLabel,
  onGoCompose,
}: InspectTrackSidebarTabsProps) {
  const panelContentByTab: Record<InspectTrackTabId, ReactNode> = {
    overview: overviewPanel,
    grid: gridPanel,
    performance: performancePanel,
    metadata: metadataPanel,
  };

  return (
    <div className="analyzer-sidebar">
      <div className="inspect-tabs">
        <ul className="inspect-tab-list" role="tablist">
          {tabs.map((tab) => (
            <li key={tab.id} role="presentation">
              <button
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={tab.panelId}
                className="inspect-tab-button"
                onClick={() => onChangeTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {tabs.map((tab) => (
          <section
            key={tab.id}
            id={tab.panelId}
            role="tabpanel"
            aria-hidden={activeTab !== tab.id}
            className="inspect-tab-content"
          >
            {panelContentByTab[tab.id]}
          </section>
        ))}
      </div>

      <div className="inspect-compose-cta">
        <p className="support-copy">{composeCopy}</p>
        <button type="button" className="action" onClick={onGoCompose}>
          {composeLabel}
        </button>
      </div>
    </div>
  );
}
