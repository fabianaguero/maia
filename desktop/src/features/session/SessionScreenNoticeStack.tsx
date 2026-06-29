import { AlertCircle } from "lucide-react";

interface SessionScreenNoticeStackProps {
  error: string | null;
  createError: string | null;
}

interface SessionNoticeProps {
  message: string;
  tone: "error" | "warn";
}

function SessionNotice({ message, tone }: SessionNoticeProps) {
  return (
    <div className={`notice session-notice-${tone}`}>
      <p>
        <AlertCircle
          size={14}
          style={{
            display: "inline",
            verticalAlign: "-2px",
            marginRight: 6,
          }}
        />
        {message}
      </p>
    </div>
  );
}

export function SessionScreenNoticeStack({ error, createError }: SessionScreenNoticeStackProps) {
  return (
    <>
      {error ? <SessionNotice message={error} tone="error" /> : null}
      {createError ? <SessionNotice message={createError} tone="warn" /> : null}
    </>
  );
}
