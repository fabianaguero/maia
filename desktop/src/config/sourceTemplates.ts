import type { AppTranslations } from "../i18n/en";

// ---------------------------------------------------------------------------
// Source Templates
// Pre-configured starting points that pair a musical style with a BPM range.
// Works for any source kind: log file, stream, websocket, process, etc.
// ---------------------------------------------------------------------------

export interface SourceTemplate {
  id: string;
  label: string;
  description: string;
  /** Suggested BPM for the sonification engine */
  bpm: number;
  /** Genre / style tag shown in the UI */
  genre: string;
  /** Maps to a StyleProfileOption id */
  styleProfileId: string;
  /** Maps to a MutationProfileOption id */
  mutationProfileId: string;
  /** Typical source kind this template is designed for */
  sourceKind: "file" | "stream" | "process" | "http" | "generic";
  /** Short hint shown under the template card */
  hint: string;
  /** Emoji icon for quick visual scanning */
  icon: string;
}

export const SOURCE_TEMPLATES: SourceTemplate[] = [
  {
    id: "chill-ambient",
    label: "Chill Ambient",
    description: "Low-energy background bed. Anomalies surface gently without breaking focus.",
    bpm: 75,
    genre: "Ambient",
    styleProfileId: "ambient-watch",
    mutationProfileId: "subtle",
    sourceKind: "generic",
    hint: "Quiet overnight monitoring, low-traffic services, or any idle stream.",
    icon: "🌙",
  },
  {
    id: "deep-house",
    label: "Deep House",
    description: "Warm groove at 120 BPM. Steady pulse keeps the team in flow.",
    bpm: 120,
    genre: "Deep House",
    styleProfileId: "steady-house",
    mutationProfileId: "balanced",
    sourceKind: "file",
    hint: "Ideal for Spring Boot / JVM log files during business hours.",
    icon: "🏠",
  },
  {
    id: "tech-house",
    label: "Tech House",
    description: "Punchy 128 BPM groove. Errors cut through without killing the vibe.",
    bpm: 128,
    genre: "Tech House",
    styleProfileId: "steady-house",
    mutationProfileId: "reactive",
    sourceKind: "http",
    hint: "HTTP streams, API gateways, and access log tails.",
    icon: "⚡",
  },
  {
    id: "melodic-techno",
    label: "Melodic Techno",
    description: "Driving 132 BPM with melodic tension. Anomalies hit like a drop.",
    bpm: 132,
    genre: "Melodic Techno",
    styleProfileId: "deep-night",
    mutationProfileId: "reactive",
    sourceKind: "stream",
    hint: "Kubernetes event streams, deployment pipelines, and websocket feeds.",
    icon: "🎛️",
  },
  {
    id: "peak-techno",
    label: "Peak Techno",
    description: "Hard 140 BPM. Maximum alerting — every spike is felt.",
    bpm: 140,
    genre: "Techno",
    styleProfileId: "alert-techno",
    mutationProfileId: "volatile",
    sourceKind: "process",
    hint: "Incident response, error spikes, on-call war rooms, live process output.",
    icon: "🚨",
  },
  {
    id: "trance-build",
    label: "Trance Build",
    description: "Euphoric 138 BPM. Long builds reward quiet periods, drops hit on errors.",
    bpm: 138,
    genre: "Trance",
    styleProfileId: "alert-techno",
    mutationProfileId: "volatile",
    sourceKind: "generic",
    hint: "High-drama monitoring for release nights and migrations.",
    icon: "🌊",
  },
  {
    id: "lo-fi-watch",
    label: "Lo-Fi Watch",
    description: "Relaxed 85 BPM. Soft cues, minimal mutation — just the data, quietly.",
    bpm: 85,
    genre: "Lo-Fi",
    styleProfileId: "ambient-watch",
    mutationProfileId: "subtle",
    sourceKind: "generic",
    hint: "Background monitoring while coding. Won't break your flow.",
    icon: "☕",
  },
];

export const DEFAULT_SOURCE_TEMPLATE_ID = "deep-house";

export function resolveSourceTemplate(id: string | null | undefined): SourceTemplate {
  return (
    SOURCE_TEMPLATES.find((t) => t.id === id) ??
    SOURCE_TEMPLATES.find((t) => t.id === DEFAULT_SOURCE_TEMPLATE_ID)!
  );
}

export interface SourceTemplatePresentation {
  label: string;
  description: string;
  genre: string;
  hint: string;
}

export function resolveSourceTemplatePresentation(
  templateOrId: SourceTemplate | string | null | undefined,
  t: AppTranslations,
): SourceTemplatePresentation | null {
  if (!templateOrId) {
    return null;
  }

  const template =
    typeof templateOrId === "string" ? resolveSourceTemplate(templateOrId) : templateOrId;

  switch (template.id) {
    case "chill-ambient":
      return t.sourceTemplates.chillAmbient;
    case "deep-house":
      return t.sourceTemplates.deepHouse;
    case "tech-house":
      return t.sourceTemplates.techHouse;
    case "melodic-techno":
      return t.sourceTemplates.melodicTechno;
    case "peak-techno":
      return t.sourceTemplates.peakTechno;
    case "trance-build":
      return t.sourceTemplates.tranceBuild;
    case "lo-fi-watch":
      return t.sourceTemplates.loFiWatch;
    default:
      return {
        label: template.label,
        description: template.description,
        genre: template.genre,
        hint: template.hint,
      };
  }
}
