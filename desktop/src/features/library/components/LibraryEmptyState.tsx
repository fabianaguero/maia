import type { ReactNode } from "react";

interface LibraryEmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  action: ReactNode;
}

export function LibraryEmptyState({ icon, title, body, action }: LibraryEmptyStateProps) {
  return (
    <div className="library-empty">
      <div className="library-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
