import type { BpmCurvePoint } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

interface BpmCurvePanelProps {
  bpmCurve: BpmCurvePoint[];
  fallbackBpm: number | null;
  durationSeconds: number | null;
}

function buildCurvePath(points: BpmCurvePoint[], width: number, height: number): string {
  if (points.length === 0) {
    return "";
  }

  const maxSecond = points[points.length - 1]?.second || 1;
  const minBpm = Math.min(...points.map((point) => point.bpm));
  const maxBpm = Math.max(...points.map((point) => point.bpm));
  const bpmSpan = Math.max(0.5, maxBpm - minBpm);
  const bpmBase = maxBpm === minBpm ? minBpm - bpmSpan / 2 : minBpm;

  return points
    .map((point, index) => {
      const x = (point.second / maxSecond) * width;
      const y = height - ((point.bpm - bpmBase) / bpmSpan) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function BpmCurvePanel({ bpmCurve, fallbackBpm, durationSeconds }: BpmCurvePanelProps) {
  const t = useT();
  const normalizedDuration = durationSeconds && durationSeconds > 0 ? durationSeconds : 0;
  const points =
    bpmCurve.length > 0
      ? bpmCurve
      : fallbackBpm && normalizedDuration > 0
        ? [
            { second: 0, bpm: fallbackBpm },
            { second: normalizedDuration, bpm: fallbackBpm },
          ]
        : [];

  const minBpm = points.length > 0 ? Math.min(...points.map((point) => point.bpm)) : null;
  const maxBpm = points.length > 0 ? Math.max(...points.map((point) => point.bpm)) : null;
  const curvePath = buildCurvePath(points, 520, 180);

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.bpmCurveTitle}</h2>
          <p className="support-copy">{t.inspect.bpmCurveCopy}</p>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="empty-state">
          <p>{t.inspect.noBpmCurve}</p>
        </div>
      ) : (
        <>
          <div className="bpm-curve-stage">
            <svg
              className="bpm-curve-svg"
              viewBox="0 0 520 180"
              preserveAspectRatio="none"
              role="img"
              aria-label={t.inspect.bpmCurveAria}
            >
              <defs>
                <linearGradient id="bpmCurveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f4b85e" />
                  <stop offset="100%" stopColor="#21b4b8" />
                </linearGradient>
              </defs>
              <path className="bpm-curve-grid" d="M 0 30 L 520 30" />
              <path className="bpm-curve-grid" d="M 0 90 L 520 90" />
              <path className="bpm-curve-grid" d="M 0 150 L 520 150" />
              <path className="bpm-curve-line" d={curvePath} />
              {points.map((point) => {
                const lastSecond = points[points.length - 1]?.second || 1;
                const floor = minBpm ?? point.bpm;
                const ceiling = maxBpm ?? point.bpm;
                const bpmSpan = Math.max(0.5, ceiling - floor);
                const bpmBase = ceiling === floor ? floor - bpmSpan / 2 : floor;
                const x = (point.second / lastSecond) * 520;
                const y = 180 - ((point.bpm - bpmBase) / bpmSpan) * 180;

                return (
                  <circle
                    key={`${point.second}-${point.bpm}`}
                    cx={x}
                    cy={y}
                    r="4"
                    className="bpm-curve-dot"
                  />
                );
              })}
            </svg>
          </div>

          <div className="waveform-summary">
            <div className="waveform-meta-pill">
              <span>{t.inspect.curvePoints}</span>
              <strong>{points.length}</strong>
            </div>
            <div className="waveform-meta-pill">
              <span>{t.inspect.minBpm}</span>
              <strong>{minBpm?.toFixed(1) ?? "--"}</strong>
            </div>
            <div className="waveform-meta-pill">
              <span>{t.inspect.maxBpm}</span>
              <strong>{maxBpm?.toFixed(1) ?? "--"}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
