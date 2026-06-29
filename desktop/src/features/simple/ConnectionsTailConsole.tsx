interface ConnectionsTailConsoleProps {
  title: string;
  statusLabel: string;
  preview: string[];
}

export function ConnectionsTailConsole({
  title,
  statusLabel,
  preview,
}: ConnectionsTailConsoleProps) {
  return (
    <div className="connections-tail-console">
      <div className="connections-tail-console__header">
        <strong>{title}</strong>
        <span>{statusLabel}</span>
      </div>
      {preview.length > 0 ? <pre>{preview.join("\n")}</pre> : null}
    </div>
  );
}
