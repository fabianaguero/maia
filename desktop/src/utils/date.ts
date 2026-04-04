function parseStoredDate(value: string): Date {
  if (/^\d+$/.test(value)) {
    return new Date(Number(value));
  }

  return new Date(value);
}

export function formatShortDateTime(value: string): string {
  const date = parseStoredDate(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(value: string): string {
  const date = parseStoredDate(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
