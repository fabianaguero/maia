import { RefreshCw } from "lucide-react";
import { useT } from "../../i18n/I18nContext";
import { ConnectionsFormPanel } from "./ConnectionsFormPanel";
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
      <div className="connections-hero panel">
        <div className="connections-hero__copy">
          <span className="connections-hero__kicker">{screenViewModel.heroKicker}</span>
          <h2>{screenViewModel.heroTitle}</h2>
          <p>{screenViewModel.heroDescription}</p>
        </div>
        <div className="connections-hero__stats">
          {screenViewModel.heroStats.map((stat) => (
            <div key={stat.key} className="connections-stat">
              <span className="connections-stat__label">{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
          <button
            type="button"
            className="control-button"
            onClick={() => void refreshConnections()}
            disabled={loading || saving}
            title={screenViewModel.refreshTitle}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

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
