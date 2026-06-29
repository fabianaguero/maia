import { isAppSkin, type AppSkin } from "./appSkin";

export type MonitorDeckVisualPreset = "passive" | "balanced" | "alert";

export interface MonitorDeckPalette {
  backgroundTop: string;
  backgroundMid: string;
  backgroundBottom: string;
  separatorLine: string;
  trackGlow: string;
  overviewBaseGlow: string;
  overviewFillStops: string[];
  phraseCool: string;
  phraseMid: string;
  phraseWarm: string;
  phraseHot: string;
  trackTopCool: string;
  trackBottomCool: string;
  trackTopMid: string;
  trackBottomMid: string;
  trackTopWarm: string;
  trackBottomWarm: string;
  trackTopHot: string;
  trackBottomHot: string;
  centerLine: string;
  logGlowTop: string;
  logGlowMid: string;
  logGlowBottom: string;
  logCool: string;
  logWarm: string;
  logHot: string;
  anomalyWarn: string;
  anomalyWarnSoft: string;
  anomalyError: string;
  anomalyErrorSoft: string;
  burstWarn: string;
  burstError: string;
  contourStroke: string;
  playheadGlow: string;
  playheadCore: string;
  markerWarnGlow: string;
  markerErrorGlow: string;
  markerWarnBeam: string;
  markerErrorBeam: string;
}

export function withAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return color;
  }
  const parts = match[1]!.split(",").map((part) => part.trim());
  return `rgba(${parts[0] ?? "255"},${parts[1] ?? "255"},${parts[2] ?? "255"},${alpha})`;
}

export function resolveCurrentMonitorDeckSkin(): AppSkin {
  if (typeof document === "undefined") {
    return "nightfall";
  }
  const skin = document.documentElement.getAttribute("data-skin");
  return isAppSkin(skin) ? skin : "nightfall";
}

function createBaseMonitorDeckPalette(preset: MonitorDeckVisualPreset): MonitorDeckPalette {
  switch (preset) {
    case "passive":
      return {
        backgroundTop: "rgba(9,14,19,0.98)",
        backgroundMid: "rgba(3,6,10,0.99)",
        backgroundBottom: "rgba(0,0,0,1)",
        separatorLine: "rgba(255,255,255,0.04)",
        trackGlow: "rgba(96,198,255,0.08)",
        overviewBaseGlow: "rgba(96,198,255,0.12)",
        overviewFillStops: [
          "rgba(136,218,255,0.72)",
          "rgba(124,214,255,0.76)",
          "rgba(182,240,166,0.74)",
          "rgba(202,246,116,0.72)",
          "rgba(120,198,255,0.78)",
          "rgba(182,226,255,0.68)",
        ],
        phraseCool: "rgba(124,214,255,0.76)",
        phraseMid: "rgba(200,255,108,0.78)",
        phraseWarm: "rgba(216,242,124,0.8)",
        phraseHot: "rgba(255,208,132,0.78)",
        trackTopCool: "rgba(214,242,255,0.88)",
        trackBottomCool: "rgba(80,180,255,0.58)",
        trackTopMid: "rgba(190,246,164,0.86)",
        trackBottomMid: "rgba(108,204,255,0.16)",
        trackTopWarm: "rgba(224,248,140,0.84)",
        trackBottomWarm: "rgba(164,214,120,0.16)",
        trackTopHot: "rgba(255,218,148,0.84)",
        trackBottomHot: "rgba(188,218,255,0.16)",
        centerLine: "rgba(96,198,255,0.82)",
        logGlowTop: "rgba(178,228,120,0)",
        logGlowMid: "rgba(178,228,120,0.06)",
        logGlowBottom: "rgba(96,198,255,0.05)",
        logCool: "rgba(120,198,255,0.2)",
        logWarm: "rgba(202,236,116,0.42)",
        logHot: "rgba(255,194,132,0.44)",
        anomalyWarn: "rgba(255,212,124,0.46)",
        anomalyWarnSoft: "rgba(255,226,164,0.14)",
        anomalyError: "rgba(255,154,120,0.48)",
        anomalyErrorSoft: "rgba(255,154,120,0.16)",
        burstWarn: "rgba(255,218,132,0.08)",
        burstError: "rgba(255,148,120,0.08)",
        contourStroke: "rgba(238,248,255,0.58)",
        playheadGlow: "rgba(255,255,255,0.12)",
        playheadCore: "rgba(255,255,255,0.84)",
        markerWarnGlow: "rgba(255,208,108,0.14)",
        markerErrorGlow: "rgba(255,92,124,0.16)",
        markerWarnBeam: "rgba(255,196,92,0.82)",
        markerErrorBeam: "rgba(255,72,108,0.88)",
      };
    case "alert":
      return {
        backgroundTop: "rgba(9,14,19,0.98)",
        backgroundMid: "rgba(3,6,10,0.99)",
        backgroundBottom: "rgba(0,0,0,1)",
        separatorLine: "rgba(255,255,255,0.04)",
        trackGlow: "rgba(72,215,255,0.16)",
        overviewBaseGlow: "rgba(72,215,255,0.22)",
        overviewFillStops: [
          "rgba(255,112,92,0.9)",
          "rgba(255,174,82,0.92)",
          "rgba(228,255,108,0.9)",
          "rgba(255,182,82,0.92)",
          "rgba(96,204,255,0.94)",
          "rgba(196,228,255,0.84)",
        ],
        phraseCool: "rgba(111,220,255,0.84)",
        phraseMid: "rgba(196,255,104,0.84)",
        phraseWarm: "rgba(255,198,82,0.9)",
        phraseHot: "rgba(255,126,82,0.92)",
        trackTopCool: "rgba(124,214,255,0.86)",
        trackBottomCool: "rgba(72,215,255,0.2)",
        trackTopMid: "rgba(200,255,108,0.9)",
        trackBottomMid: "rgba(120,198,255,0.18)",
        trackTopWarm: "rgba(255,198,82,0.92)",
        trackBottomWarm: "rgba(255,156,92,0.2)",
        trackTopHot: "rgba(255,118,84,0.96)",
        trackBottomHot: "rgba(255,72,108,0.26)",
        centerLine: "rgba(72,215,255,0.92)",
        logGlowTop: "rgba(255,176,84,0)",
        logGlowMid: "rgba(255,176,84,0.1)",
        logGlowBottom: "rgba(72,215,255,0.08)",
        logCool: "rgba(120,198,255,0.32)",
        logWarm: "rgba(255,194,92,0.64)",
        logHot: "rgba(255,96,110,0.78)",
        anomalyWarn: "rgba(255,196,92,0.6)",
        anomalyWarnSoft: "rgba(255,196,92,0.18)",
        anomalyError: "rgba(255,72,108,0.72)",
        anomalyErrorSoft: "rgba(255,72,108,0.24)",
        burstWarn: "rgba(255,196,92,0.14)",
        burstError: "rgba(255,72,108,0.18)",
        contourStroke: "rgba(238,248,255,0.66)",
        playheadGlow: "rgba(255,255,255,0.16)",
        playheadCore: "rgba(255,255,255,0.92)",
        markerWarnGlow: "rgba(255,208,108,0.14)",
        markerErrorGlow: "rgba(255,92,124,0.16)",
        markerWarnBeam: "rgba(255,196,92,0.82)",
        markerErrorBeam: "rgba(255,72,108,0.88)",
      };
    case "balanced":
    default:
      return {
        backgroundTop: "rgba(9,14,19,0.98)",
        backgroundMid: "rgba(3,6,10,0.99)",
        backgroundBottom: "rgba(0,0,0,1)",
        separatorLine: "rgba(255,255,255,0.04)",
        trackGlow: "rgba(72,215,255,0.12)",
        overviewBaseGlow: "rgba(72,215,255,0.18)",
        overviewFillStops: [
          "rgba(255,120,92,0.82)",
          "rgba(244,214,94,0.84)",
          "rgba(195,255,108,0.86)",
          "rgba(255,198,82,0.88)",
          "rgba(120,198,255,0.88)",
          "rgba(176,222,255,0.78)",
        ],
        phraseCool: "rgba(111,220,255,0.8)",
        phraseMid: "rgba(196,255,104,0.82)",
        phraseWarm: "rgba(255,198,82,0.84)",
        phraseHot: "rgba(255,126,82,0.88)",
        trackTopCool: "rgba(124,214,255,0.82)",
        trackBottomCool: "rgba(72,215,255,0.18)",
        trackTopMid: "rgba(200,255,108,0.88)",
        trackBottomMid: "rgba(120,198,255,0.16)",
        trackTopWarm: "rgba(255,198,82,0.9)",
        trackBottomWarm: "rgba(255,156,92,0.18)",
        trackTopHot: "rgba(255,118,84,0.92)",
        trackBottomHot: "rgba(255,72,108,0.22)",
        centerLine: "rgba(72,215,255,0.88)",
        logGlowTop: "rgba(255,176,84,0)",
        logGlowMid: "rgba(255,176,84,0.08)",
        logGlowBottom: "rgba(72,215,255,0.06)",
        logCool: "rgba(120,198,255,0.28)",
        logWarm: "rgba(255,194,92,0.58)",
        logHot: "rgba(255,96,110,0.68)",
        anomalyWarn: "rgba(255,196,92,0.56)",
        anomalyWarnSoft: "rgba(255,196,92,0.16)",
        anomalyError: "rgba(255,72,108,0.62)",
        anomalyErrorSoft: "rgba(255,72,108,0.2)",
        burstWarn: "rgba(255,196,92,0.1)",
        burstError: "rgba(255,72,108,0.12)",
        contourStroke: "rgba(238,248,255,0.64)",
        playheadGlow: "rgba(255,255,255,0.14)",
        playheadCore: "rgba(255,255,255,0.92)",
        markerWarnGlow: "rgba(255,208,108,0.14)",
        markerErrorGlow: "rgba(255,92,124,0.16)",
        markerWarnBeam: "rgba(255,196,92,0.82)",
        markerErrorBeam: "rgba(255,72,108,0.88)",
      };
  }
}

export function resolveMonitorDeckPalette(
  preset: MonitorDeckVisualPreset,
  skin: AppSkin = "nightfall",
): MonitorDeckPalette {
  const base = createBaseMonitorDeckPalette(preset);

  switch (skin) {
    case "arctic":
      return {
        ...base,
        backgroundTop: "rgba(8,20,31,0.98)",
        backgroundMid: "rgba(4,10,17,0.99)",
        backgroundBottom: "rgba(1,4,8,1)",
        separatorLine: "rgba(168,221,255,0.06)",
        trackGlow: withAlpha(
          "rgba(125,227,255,1)",
          preset === "alert" ? 0.18 : preset === "passive" ? 0.1 : 0.14,
        ),
        overviewBaseGlow: withAlpha(
          "rgba(125,227,255,1)",
          preset === "alert" ? 0.24 : preset === "passive" ? 0.14 : 0.2,
        ),
        phraseCool: "rgba(173,238,255,0.88)",
        trackTopCool: "rgba(228,247,255,0.92)",
        trackBottomCool: "rgba(109,202,255,0.54)",
        centerLine: "rgba(125,227,255,0.94)",
        logGlowBottom: "rgba(125,227,255,0.1)",
        logCool: "rgba(134,214,255,0.34)",
        contourStroke: "rgba(236,249,255,0.76)",
        playheadGlow: "rgba(188,235,255,0.2)",
        playheadCore: "rgba(244,252,255,0.96)",
        markerWarnGlow: "rgba(148,217,255,0.14)",
        markerErrorGlow: "rgba(255,124,158,0.18)",
        markerWarnBeam: "rgba(146,219,255,0.84)",
        markerErrorBeam: "rgba(255,104,136,0.9)",
      };
    case "copper":
      return {
        ...base,
        backgroundTop: "rgba(22,14,13,0.98)",
        backgroundMid: "rgba(11,7,7,0.99)",
        backgroundBottom: "rgba(4,2,2,1)",
        separatorLine: "rgba(255,220,180,0.05)",
        trackGlow: withAlpha(
          "rgba(255,176,102,1)",
          preset === "alert" ? 0.18 : preset === "passive" ? 0.1 : 0.14,
        ),
        overviewBaseGlow: withAlpha(
          "rgba(255,176,102,1)",
          preset === "alert" ? 0.24 : preset === "passive" ? 0.14 : 0.2,
        ),
        overviewFillStops: [
          "rgba(255,132,102,0.86)",
          "rgba(255,182,96,0.9)",
          "rgba(246,206,99,0.88)",
          "rgba(255,174,90,0.9)",
          "rgba(255,216,164,0.86)",
          "rgba(255,236,206,0.8)",
        ],
        phraseCool: "rgba(255,214,164,0.84)",
        phraseMid: "rgba(246,206,99,0.84)",
        phraseWarm: "rgba(255,182,96,0.88)",
        phraseHot: "rgba(255,120,96,0.92)",
        trackTopCool: "rgba(255,232,204,0.9)",
        trackBottomCool: "rgba(255,176,102,0.42)",
        trackTopMid: "rgba(246,218,132,0.9)",
        trackBottomMid: "rgba(255,180,104,0.16)",
        trackTopWarm: "rgba(255,186,104,0.92)",
        trackBottomWarm: "rgba(255,136,96,0.2)",
        trackTopHot: "rgba(255,118,84,0.96)",
        trackBottomHot: "rgba(255,92,122,0.22)",
        centerLine: "rgba(255,176,102,0.92)",
        logGlowTop: "rgba(255,194,116,0)",
        logGlowMid: "rgba(255,194,116,0.12)",
        logGlowBottom: "rgba(255,176,102,0.08)",
        logCool: "rgba(255,186,116,0.28)",
        logWarm: "rgba(246,206,99,0.6)",
        logHot: "rgba(255,120,96,0.72)",
        contourStroke: "rgba(255,244,226,0.72)",
        playheadGlow: "rgba(255,224,196,0.18)",
        playheadCore: "rgba(255,250,242,0.96)",
        markerWarnGlow: "rgba(255,196,108,0.18)",
        markerErrorGlow: "rgba(255,102,122,0.18)",
        markerWarnBeam: "rgba(255,196,92,0.86)",
        markerErrorBeam: "rgba(255,92,122,0.9)",
      };
    case "nightfall":
    default:
      return base;
  }
}
