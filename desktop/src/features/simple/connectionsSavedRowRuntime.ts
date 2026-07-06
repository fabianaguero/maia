import type { ConnectionsSavedListRowViewModel } from "./connectionsSavedListViewModel";

export function resolveConnectionsSavedRowStatusChipClass(
  row: ConnectionsSavedListRowViewModel,
): string {
  if (row.testTone === "success") {
    return "connections-saved-row__chip connections-saved-row__chip--success";
  }
  if (row.testTone === "error") {
    return "connections-saved-row__chip connections-saved-row__chip--error";
  }
  return "connections-saved-row__chip connections-saved-row__chip--testing";
}
