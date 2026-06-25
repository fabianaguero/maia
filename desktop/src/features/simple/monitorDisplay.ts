export function getBasename(path: string | null | undefined): string {
  if (!path) {
    return "unknown-source";
  }

  const segments = path.split("/");
  return segments[segments.length - 1] || path;
}

export function truncateMiddle(value: string | null | undefined, maxLength = 56): string {
  if (!value) {
    return "unknown";
  }
  if (value.length <= maxLength) {
    return value;
  }

  const half = Math.max(8, Math.floor((maxLength - 3) / 2));
  return `${value.slice(0, half)}...${value.slice(-half)}`;
}
