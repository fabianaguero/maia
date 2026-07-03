export interface ArrangementSection {
  id: string;
  role: string;
  label: string;
  energy: string;
  startBar: number;
  endBar: number;
  startSecond: number;
  endSecond: number;
  focus: string;
}

export interface CuePoint {
  id: string;
  label: string;
  role: string;
  bar: number;
  second: number;
}

export interface RenderStem {
  id: string;
  label: string;
  role: string;
  source: string;
  focus: string;
  gainDb: number;
  pan: number;
  sectionIds: string[];
}

export interface RenderAutomationMove {
  id: string;
  target: string;
  move: string;
  sectionId: string;
  startBar: number;
  endBar: number;
}

export interface RenderPreview {
  mode: string;
  headroomDb: number;
  masterChain: string[];
  exportTargets: string[];
  stems: RenderStem[];
  automation: RenderAutomationMove[];
}
