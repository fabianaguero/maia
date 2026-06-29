import { useT } from "../../i18n/I18nContext";
import { ConnectionsFormPanel } from "./ConnectionsFormPanel";
import { ConnectionsHeroPanel } from "./ConnectionsHeroPanel";
import { ConnectionsSavedListPanel } from "./ConnectionsSavedListPanel";
import { useConnectionsScreenState } from "./useConnectionsScreenState";

interface ConnectionsScreenProps {
  defaultCloudLookback?: string;
}

export function ConnectionsScreen({ defaultCloudLookback = "10m" }: ConnectionsScreenProps) {
  const t = useT();
  const {
    screenViewModel,
    connectionKindLabel,
    connections,
    editingConnectionId,
    draft,
    loading,
    saving,
    pickerBusy,
    error,
    activeSessionId,
    activeConnectionId,
    tailPreview,
    tailStatus,
    testStatusById,
    testMessageById,
    setDraft,
    refreshConnections,
    resetForm,
    loadConnectionIntoForm,
    handleBrowseFile,
    handleSaveConnection,
    handleStartTail,
    handleStopTail,
    handleDeleteConnection,
    handleTestConnection,
  } = useConnectionsScreenState({
    t,
    defaultCloudLookback,
  });

  return (
    <section className="connections-screen">
      <ConnectionsHeroPanel
        viewModel={screenViewModel}
        loading={loading}
        saving={saving}
        onRefreshConnections={refreshConnections}
      />

      <div className="connections-layout">
        <ConnectionsFormPanel
          editingConnectionId={editingConnectionId}
          draft={draft}
          saving={saving}
          loading={loading}
          pickerBusy={pickerBusy}
          error={error}
          onKindChange={(nextKind) => setDraft((current) => ({ ...current, kind: nextKind }))}
          onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          onBrowseFile={handleBrowseFile}
          onSaveConnection={handleSaveConnection}
          onCancelEdit={resetForm}
        />

        <ConnectionsSavedListPanel
          loading={loading}
          connections={connections}
          editingConnectionId={editingConnectionId}
          connectionKindLabel={connectionKindLabel}
          activeConnectionId={activeConnectionId}
          activeSessionId={activeSessionId}
          saving={saving}
          testStatusById={testStatusById}
          testMessageById={testMessageById}
          tailStatus={tailStatus}
          tailPreview={tailPreview}
          onRefreshConnections={refreshConnections}
          onSelectConnection={loadConnectionIntoForm}
          onStartTail={handleStartTail}
          onStopTail={handleStopTail}
          onEditConnection={loadConnectionIntoForm}
          onTestConnection={handleTestConnection}
          onDeleteConnection={handleDeleteConnection}
        />
      </div>
    </section>
  );
}
