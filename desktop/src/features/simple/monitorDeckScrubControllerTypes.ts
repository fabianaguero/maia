export interface DeckOverviewScrubMarker {
  id: string;
  progress: number;
  observedAtMs?: number;
}

export interface MonitorDeckScrubRefs {
  overviewCanvasRef: { current: HTMLCanvasElement | null };
  waveformStageRef: { current: HTMLDivElement | null };
  isOverviewScrubbingRef: { current: boolean };
  activeOverviewPointerIdRef: { current: number | null };
  isDeckScrubbingRef: { current: boolean };
  activeDeckPointerIdRef: { current: number | null };
  deckScrubStartProgressRef: { current: number };
  deckScrubStartRatioRef: { current: number };
}
