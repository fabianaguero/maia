import { useT } from "../../../i18n/I18nContext";
import type { ResolvedLiveSonificationScene } from "./liveSonificationScene";

interface LiveSonificationSceneRoutesProps {
  scene: ResolvedLiveSonificationScene;
}

export function LiveSonificationSceneRoutes({ scene }: LiveSonificationSceneRoutesProps) {
  const t = useT();

  return (
    <>
      <div className="panel-header compact top-spaced">
        <div>
          <h2>{t.inspect.liveRouting}</h2>
          <p className="support-copy">{t.inspect.liveRoutingCopy}</p>
        </div>
      </div>

      <div className="live-scene-route-grid">
        {scene.routes.map((route) => (
          <article key={route.key} className={`live-scene-route-card route-${route.key}`}>
            <span>
              {route.key} · {route.waveform}
            </span>
            <strong>{route.label}</strong>
            <small>
              {route.stemLabel} · {route.sectionLabel}
            </small>
            <p>{route.focus}</p>
            <div className="pill-strip">
              <span>{route.cueLabel}</span>
              <span>{route.sampleLabel ?? t.inspect.synthFallback}</span>
              <span>
                {route.pan > 0
                  ? t.inspect.panRight.replace("{value}", route.pan.toFixed(2))
                  : route.pan < 0
                    ? t.inspect.panLeft.replace("{value}", Math.abs(route.pan).toFixed(2))
                    : t.inspect.panCenter}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
