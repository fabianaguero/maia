import type { AppTranslations } from "../../i18n/types";
import { SOURCE_TEMPLATES, resolveSourceTemplatePresentation } from "../../config/sourceTemplates";
import type { QuickSessionMode } from "./sessionDisplay";

export function formatMonitorConfidence(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatMonitorLevel(
  level: string | null | undefined,
  awaitingInputLabel: string,
): string {
  if (!level) {
    return awaitingInputLabel;
  }

  return level
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function resolveSessionTemplateLabel(
  sourceTemplateId: string | null | undefined,
  t: AppTranslations,
  noTemplateLabel: string,
  unknownTemplateLabel: string,
): string {
  if (!sourceTemplateId) {
    return noTemplateLabel;
  }

  const found = SOURCE_TEMPLATES.find((template) => template.id === sourceTemplateId);
  if (!found) {
    return unknownTemplateLabel;
  }

  return resolveSourceTemplatePresentation(found, t)?.label ?? found.label;
}

export function resolveModeLabel(
  mode: QuickSessionMode,
  logLabel: string,
  repositoryLabel: string,
): string {
  return mode === "log" ? logLabel : repositoryLabel;
}
