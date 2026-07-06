import { useState } from "react";

import type { LogSourceConnection } from "../../types/monitor";
import type { ConnectionDraft } from "./connectionsViewModel";
import { buildConnectionsFormResetState } from "./connectionsFormControllerRuntime";

export interface ConnectionsFormLocalState {
  connections: LogSourceConnection[];
  setConnections: React.Dispatch<React.SetStateAction<LogSourceConnection[]>>;
  editingConnectionId: string | null;
  setEditingConnectionId: React.Dispatch<React.SetStateAction<string | null>>;
  draft: ConnectionDraft;
  setDraft: React.Dispatch<React.SetStateAction<ConnectionDraft>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  pickerBusy: boolean;
  setPickerBusy: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useConnectionsFormLocalState(
  defaultCloudLookback: string,
): ConnectionsFormLocalState {
  const [connections, setConnections] = useState<LogSourceConnection[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ConnectionDraft>(
    () => buildConnectionsFormResetState(defaultCloudLookback).draft,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    connections,
    setConnections,
    editingConnectionId,
    setEditingConnectionId,
    draft,
    setDraft,
    loading,
    setLoading,
    saving,
    setSaving,
    pickerBusy,
    setPickerBusy,
    error,
    setError,
  };
}
