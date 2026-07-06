interface SimpleLibraryHeaderProps {
  title: string;
  subtitle: string;
}

export function SimpleLibraryHeader({ title, subtitle }: SimpleLibraryHeaderProps) {
  return (
    <div className="library-header">
      <h2 className="library-title">{title}</h2>
      <p className="library-subtitle">{subtitle}</p>
    </div>
  );
}
