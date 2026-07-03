import { Plus } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";

interface ProLibraryProfilesSectionProps {
  t: AppTranslations;
}

export function ProLibraryProfilesSection({ t }: ProLibraryProfilesSectionProps) {
  return (
    <div className="profiles-section empty-state">
      <div className="empty-icon">◆</div>
      <h3>{t.library.noBasePacksYet}</h3>
      <button className="btn-primary">
        <Plus size={16} />
        {t.library.importBaseAsset}
      </button>
    </div>
  );
}
