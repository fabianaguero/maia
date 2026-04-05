import type { ComponentOverride } from "./liveSonificationScene";
import { resolveComponentRoute } from "./liveSonificationScene";

// ---------------------------------------------------------------------------
// Mock components shown in browser mode or when no live data has arrived yet
// ---------------------------------------------------------------------------
const MOCK_COMPONENTS = [
  "AuthService",
  "OrderProcessor",
  "PaymentGateway",
  "NotificationWorker",
  "CacheManager",
];

interface ComponentRoutingPanelProps {
  /** Components detected during the live session (max 12). */
  knownComponents: string[];
  overrides: Map<string, ComponentOverride>;
  onOverrideChange: (component: string, override: ComponentOverride) => void;
  /** True when the live session is active (real data). */
  liveActive: boolean;
}

function panLabel(pan: number): string {
  if (pan > 0.05) return `R ${pan.toFixed(2)}`;
  if (pan < -0.05) return `L ${Math.abs(pan).toFixed(2)}`;
  return "C";
}

export function ComponentRoutingPanel({
  knownComponents,
  overrides,
  onOverrideChange,
  liveActive,
}: ComponentRoutingPanelProps) {
  const displayComponents =
    knownComponents.length > 0 ? knownComponents : liveActive ? [] : MOCK_COMPONENTS;
  const isMock = knownComponents.length === 0 && !liveActive;

  function getOverride(component: string): ComponentOverride {
    return overrides.get(component) ?? { gainMult: 1.0, muted: false };
  }

  function setGain(component: string, raw: number) {
    const current = getOverride(component);
    onOverrideChange(component, { ...current, gainMult: raw });
  }

  function toggleMute(component: string) {
    const current = getOverride(component);
    onOverrideChange(component, { ...current, muted: !current.muted });
  }

  function resetAll() {
    for (const component of displayComponents) {
      onOverrideChange(component, { gainMult: 1.0, muted: false });
    }
  }

  return (
    <section className="panel">
      <div className="panel-header compact">
        <div>
          <h2>Component routing</h2>
          <p className="support-copy">
            {isMock
              ? "Preview — mock components shown before first live session. Controls become active on live tail start."
              : knownComponents.length === 0
                ? "No components detected yet. Start a live tail session to populate this table."
                : "Per-component gain and mute controls. Pan and pitch are auto-assigned by detection order."}
          </p>
        </div>
        {displayComponents.length > 0 && (
          <button
            type="button"
            className="secondary-action"
            onClick={resetAll}
          >
            Reset all
          </button>
        )}
      </div>

      {displayComponents.length === 0 ? (
        <div className="empty-state">
          <p>Waiting for live log events…</p>
        </div>
      ) : (
        <div className={`component-route-table${isMock ? " component-route-table--mock" : ""}`}>
          <div className="component-route-header">
            <span>Component</span>
            <span>Pan</span>
            <span>Pitch ×</span>
            <span>Gain</span>
            <span>Mute</span>
          </div>

          {displayComponents.map((component) => {
            const route = resolveComponentRoute(component, displayComponents);
            const override = getOverride(component);
            const muted = override.muted;
            const gain = override.gainMult;

            return (
              <div
                key={component}
                className={`component-route-row${muted ? " component-route-row--muted" : ""}`}
              >
                <span className="component-route-name" title={component}>
                  {component}
                </span>

                <span className="component-route-pill">
                  {panLabel(route.pan)}
                </span>

                <span className="component-route-pill">
                  ×{route.noteMultiplier.toFixed(2)}
                </span>

                <label className="component-route-gain">
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.05}
                    value={gain}
                    disabled={muted || isMock}
                    aria-label={`Gain for ${component}`}
                    onChange={(e) => setGain(component, Number(e.target.value))}
                  />
                  <span>{(gain * 100).toFixed(0)} %</span>
                </label>

                <button
                  type="button"
                  className={`component-mute-btn${muted ? " component-mute-btn--active" : ""}`}
                  disabled={isMock}
                  aria-pressed={muted}
                  aria-label={`${muted ? "Unmute" : "Mute"} ${component}`}
                  onClick={() => toggleMute(component)}
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
