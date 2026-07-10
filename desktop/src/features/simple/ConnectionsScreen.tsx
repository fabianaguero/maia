import { ScreenBusyOverlay } from "../../components/ScreenBusyOverlay";
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
    pendingConnectionId,
    tailPhase,
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
  const isBusy = loading || saving || pickerBusy || pendingConnectionId !== null;
  const busyTitle = pendingConnectionId
    ? tailPhase === "stopping"
      ? t.simpleMode.connections.stopLiveTail
      : t.simpleMode.connections.openingLiveTail
    : pickerBusy
      ? t.simpleMode.connections.loading
      : saving
        ? t.simpleMode.status.loading
        : loading
          ? t.simpleMode.connections.loading
          : t.simpleMode.status.loading;
  const busyDetail = pendingConnectionId
    ? (tailStatus ?? t.simpleMode.connections.waitingCloudEntries)
    : pickerBusy
      ? t.simpleMode.connections.logFilePath
      : screenViewModel.heroDescription;
  const busyBadge = pendingConnectionId
    ? t.simpleMode.connections.liveTail
    : saving
      ? t.simpleMode.connections.saveConnection
      : loading
        ? screenViewModel.refreshTitle
        : t.simpleMode.connections.loading;

  return (
    <section className="connections-screen">
      <ScreenBusyOverlay visible={isBusy} title={busyTitle} detail={busyDetail} badge={busyBadge} />
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
          pendingConnectionId={pendingConnectionId}
          tailPhase={tailPhase}
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
