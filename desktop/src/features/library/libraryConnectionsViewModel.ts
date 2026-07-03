import type { AppTranslations } from "../../i18n/types";
import type { LogSourceConnection } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { resolveLibraryConnectionKindLabel } from "./libraryScreenViewModel";

export interface LibraryConnectionCardViewModel {
  id: string;
  title: string;
  meta: string;
  sourceUri: string;
  updatedAtLabel: string;
  isEnabled: boolean;
}

export function buildLibraryConnectionsViewModel(input: {
  connections: LogSourceConnection[];
  t: AppTranslations;
}): LibraryConnectionCardViewModel[] {
  const { connections, t } = input;

  return connections.map((connection) => ({
    id: connection.id,
    title: connection.label,
    meta: [
      resolveLibraryConnectionKindLabel(connection.kind, t),
      connection.enabled ? t.library.enabled : t.library.disabled,
      connection.adapterKind,
    ].join(" · "),
    sourceUri: connection.sourceUri,
    updatedAtLabel: formatShortDate(connection.updatedAt),
    isEnabled: connection.enabled,
  }));
}
