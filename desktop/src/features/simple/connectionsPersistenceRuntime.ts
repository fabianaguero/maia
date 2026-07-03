import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnection, UpsertLogSourceConnectionInput } from "../../types/monitor";
import type { ConnectionDraft } from "./connectionsViewModel";
import { buildConnectionUpsertInput } from "./connectionsViewModel";

function resolveAsyncErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function refreshConnectionsState(input: {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setConnections: Dispatch<SetStateAction<LogSourceConnection[]>>;
  listLogSourceConnections: () => Promise<LogSourceConnection[]>;
}): Promise<void> {
  try {
    input.setLoading(true);
    input.setError(null);
    input.setConnections(await input.listLogSourceConnections());
  } catch (error) {
    input.setError(resolveAsyncErrorMessage(error));
  } finally {
    input.setLoading(false);
  }
}

export async function saveConnectionState(input: {
  draft: ConnectionDraft;
  editingConnectionId: string | null;
  t: AppTranslations;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  upsertLogSourceConnection: (payload: UpsertLogSourceConnectionInput) => Promise<unknown>;
  onAfterSave: () => Promise<void>;
}): Promise<void> {
  try {
    input.setSaving(true);
    input.setError(null);
    const nextInput = buildConnectionUpsertInput({
      draft: input.draft,
      editingConnectionId: input.editingConnectionId,
      t: input.t,
    });
    if (!nextInput.ok) {
      input.setError(nextInput.error);
      return;
    }

    await input.upsertLogSourceConnection(nextInput.value);
    await input.onAfterSave();
  } catch (error) {
    input.setError(resolveAsyncErrorMessage(error));
  } finally {
    input.setSaving(false);
  }
}

export async function deleteConnectionState(input: {
  id: string;
  editingConnectionId: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  deleteLogSourceConnection: (id: string) => Promise<unknown>;
  resetForm: () => void;
  refreshConnections: () => Promise<void>;
}): Promise<void> {
  try {
    input.setError(null);
    await input.deleteLogSourceConnection(input.id);
    if (input.editingConnectionId === input.id) {
      input.resetForm();
    }
    await input.refreshConnections();
  } catch (error) {
    input.setError(resolveAsyncErrorMessage(error));
  }
}
