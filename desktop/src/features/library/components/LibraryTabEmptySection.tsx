import { Cable, FolderOpen, Music, PackagePlus, Plus } from "lucide-react";

import { LibraryEmptyState } from "./LibraryEmptyState";
import type { LibraryTabEmptyIconKind } from "./libraryTabContentRuntime";

interface LibraryTabEmptySectionProps {
  iconKind: LibraryTabEmptyIconKind;
  title: string;
  body: string;
  actionLabel: string;
  onShowForm: () => void;
}

function renderEmptyIcon(iconKind: LibraryTabEmptyIconKind) {
  if (iconKind === "tracks") {
    return <Music size={32} />;
  }
  if (iconKind === "sources") {
    return <FolderOpen size={32} />;
  }
  if (iconKind === "connections") {
    return <Cable size={32} />;
  }
  return <PackagePlus size={32} />;
}

export function LibraryTabEmptySection({
  iconKind,
  title,
  body,
  actionLabel,
  onShowForm,
}: LibraryTabEmptySectionProps) {
  return (
    <LibraryEmptyState
      icon={renderEmptyIcon(iconKind)}
      title={title}
      body={body}
      action={
        <button type="button" className="action" onClick={onShowForm}>
          <Plus size={14} /> {actionLabel}
        </button>
      }
    />
  );
}
