export function getBasename(path: string | null | undefined): string {
  if (!path) {
    return "—";
  }

  const segments = path.split("/");
  return segments[segments.length - 1] || path;
}

export function truncateMiddle(value: string | null | undefined, maxLength = 56): string {
  if (!value) {
    return "—";
  }
  if (value.length <= maxLength) {
    return value;
  }

  const half = Math.max(8, Math.floor((maxLength - 3) / 2));
  return `${value.slice(0, half)}...${value.slice(-half)}`;
}

export function formatAnomalyCueCode(anomalyId: string | null | undefined): string {
  if (!anomalyId) {
    return "A-0000";
  }

  let hash = 0;
  for (let index = 0; index < anomalyId.length; index += 1) {
    hash = (hash * 33 + anomalyId.charCodeAt(index)) % 10_000;
  }

  return `A-${hash.toString().padStart(4, "0")}`;
}
