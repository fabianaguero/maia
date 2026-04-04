export type AppScreen = "library" | "analyzer";

export interface LibraryTrack {
  id: string;
  title: string;
  sourcePath: string;
  importedAt: string;
  bpm: number | null;
  bpmConfidence: number;
  durationSeconds: number | null;
  waveformBins: number[];
  analyzerStatus: string;
  repoSuggestedBpm: number | null;
  repoSuggestedStatus: string;
  notes: string[];
  fileExtension: string;
}

export interface ImportTrackInput {
  title: string;
  sourcePath: string;
}

