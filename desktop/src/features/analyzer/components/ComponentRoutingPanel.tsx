import type { ComponentOverride } from "./liveSonificationScene";
import { useT } from "../../../i18n/I18nContext";
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
  const t = useT();
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
          <h2>{t.inspect.componentRouting}</h2>
          <p className="support-copy">
            {isMock
              ? t.inspect.componentRoutingPreview
              : knownComponents.length === 0
                ? t.inspect.componentRoutingEmpty
                : t.inspect.componentRoutingLive}
          </p>
        </div>
        {displayComponents.length > 0 && (
          <button type="button" className="secondary-action" onClick={resetAll}>
            {t.inspect.resetAll}
          </button>
        )}
      </div>

      {displayComponents.length === 0 ? (
        <div className="empty-state">
          <p>{t.inspect.waitingLiveLogEvents}</p>
        </div>
      ) : (
        <div className={`component-route-table${isMock ? " component-route-table--mock" : ""}`}>
          <div className="component-route-header">
            <span>{t.inspect.component}</span>
            <span>{t.inspect.pan}</span>
            <span>{t.inspect.pitchMultiplier}</span>
            <span>{t.inspect.gain}</span>
            <span>{t.inspect.mute}</span>
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

                <span className="component-route-pill">{panLabel(route.pan)}</span>

                <span className="component-route-pill">×{route.noteMultiplier.toFixed(2)}</span>

                <label className="component-route-gain">
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.05}
                    value={gain}
                    disabled={muted || isMock}
                    aria-label={t.inspect.gainFor.replace("{component}", component)}
                    onChange={(e) => setGain(component, Number(e.target.value))}
                  />
                  <span>{(gain * 100).toFixed(0)} %</span>
                </label>

                <button
                  type="button"
                  className={`component-mute-btn${muted ? " component-mute-btn--active" : ""}`}
                  disabled={isMock}
                  aria-pressed={muted}
                  aria-label={
                    muted
                      ? t.inspect.unmuteNamed.replace("{component}", component)
                      : t.inspect.muteNamed.replace("{component}", component)
                  }
                  onClick={() => toggleMute(component)}
                >
                  {muted ? t.inspect.unmuteAction : t.inspect.muteAction}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
