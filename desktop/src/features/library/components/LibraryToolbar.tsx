import type { ReactNode } from "react";

interface LibraryToolbarAction {
  id: string;
  label: string;
  icon: ReactNode;
  className: string;
  onClick: () => void | Promise<void>;
}

interface LibraryToolbarProps {
  eyebrow: string;
  count: string;
  title: string;
  note: string;
  actions: LibraryToolbarAction[];
}

export function LibraryToolbar({
  eyebrow,
  count,
  title,
  note,
  actions,
}: LibraryToolbarProps) {
  return (
    <div className="library-tab-toolbar">
      <div className="library-tab-toolbar-copy">
        <div className="library-tab-toolbar-meta">
          <span className="eyebrow">{eyebrow}</span>
          <span className="library-toolbar-count">{count}</span>
        </div>
        <strong>{title}</strong>
        <p className="library-tab-toolbar-note">{note}</p>
      </div>

      <div className="library-tab-toolbar-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={action.className}
            onClick={() => void action.onClick()}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
