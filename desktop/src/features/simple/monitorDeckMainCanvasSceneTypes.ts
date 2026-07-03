export interface MonitorDeckGradientStop {
  offset: number;
  color: string;
}

export interface MonitorDeckRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MonitorDeckCanvasScenePlan {
  background: {
    fillStops: MonitorDeckGradientStop[];
    headerSeparator: MonitorDeckRect;
    laneSeparator: MonitorDeckRect;
    centerBand: MonitorDeckRect;
    playheadColumn: MonitorDeckRect;
  };
  track: {
    glowRect: MonitorDeckRect;
    glowStops: MonitorDeckGradientStop[];
    energyBandTopY: number;
    energyBandHeight: number;
    phraseRibbonTopY: number;
    phraseRibbonHeight: number;
    fillStops: MonitorDeckGradientStop[];
    glossStops: MonitorDeckGradientStop[];
    glossAmplitudeScale: number;
  };
  log: {
    glowRect: MonitorDeckRect;
    glowStops: MonitorDeckGradientStop[];
    bedRect: MonitorDeckRect;
    bedStops: MonitorDeckGradientStop[];
    waveformStops: MonitorDeckGradientStop[];
    waveformAmplitudeScale: number;
    quantizedBlockAmplitudeScale: number;
    contourPoints: Array<{ x: number; y: number }>;
    contourStops: MonitorDeckGradientStop[];
  };
  overlay: {
    playheadGlowRect: MonitorDeckRect;
    playheadGlowStops: MonitorDeckGradientStop[];
  };
}
