import { useState } from "react";
import type { LibraryTrack, RepositoryAnalysis, BaseAssetRecord } from "../../types/library";
import { useT } from "../../i18n/I18nContext";
import { ProLibraryProfilesSection } from "./ProLibraryProfilesSection";
import { ProLibrarySoundsSection } from "./ProLibrarySoundsSection";
import { ProLibrarySourcesSection } from "./ProLibrarySourcesSection";
import { ProLibraryTabs } from "./ProLibraryTabs";
import type { ProLibraryTabId } from "./proLibraryScreenRuntime";

interface ProLibraryScreenProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
}

export function ProLibraryScreen({ tracks, repositories, baseAssets }: ProLibraryScreenProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<ProLibraryTabId>("sounds");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  return (
    <div className="pro-library-screen">
      <ProLibraryTabs
        activeTab={activeTab}
        trackCount={tracks.length}
        repositoryCount={repositories.length}
        baseAssetCount={baseAssets.length}
        t={t}
        onSelectTab={setActiveTab}
      />

      <div className="library-content">
        {activeTab === "sources" ? (
          <ProLibrarySourcesSection
            repositories={repositories}
            selectedSource={selectedSource}
            t={t}
            onSelectSource={setSelectedSource}
          />
        ) : null}

        {activeTab === "profiles" ? <ProLibraryProfilesSection t={t} /> : null}

        {activeTab === "sounds" ? <ProLibrarySoundsSection tracks={tracks} t={t} /> : null}
      </div>
    </div>
  );
}
