export function numberField(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
