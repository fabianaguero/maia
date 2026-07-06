import { numberField, stringField } from "./compositionPreviewFieldsRuntime";
import type { RenderAutomationMove, RenderPreview, RenderStem } from "./compositionPreviewTypes";

function readPersistedRenderStems(raw: unknown): RenderStem[] {
  const stemsRaw = Array.isArray(raw) ? raw : [];

  return stemsRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const stem = entry as Record<string, unknown>;
      const label = stringField(stem.label);
      const gainDb = numberField(stem.gainDb);
      const pan = numberField(stem.pan);
      const sectionIds = Array.isArray(stem.sectionIds)
        ? stem.sectionIds.filter((sectionId): sectionId is string => typeof sectionId === "string")
        : [];

      if (label === null || gainDb === null || pan === null) {
        return null;
      }

      return {
        id: stringField(stem.id) ?? `stem-${index}`,
        label,
        role: stringField(stem.role) ?? "stem",
        source: stringField(stem.source) ?? "base-asset",
        focus: stringField(stem.focus) ?? "Render preview stem",
        gainDb,
        pan,
        sectionIds,
      };
    })
    .filter((entry): entry is RenderStem => entry !== null);
}

function readPersistedRenderAutomation(raw: unknown): RenderAutomationMove[] {
  const automationRaw = Array.isArray(raw) ? raw : [];

  return automationRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const move = entry as Record<string, unknown>;
      const target = stringField(move.target);
      const action = stringField(move.move);
      const sectionId = stringField(move.sectionId);
      const startBar = numberField(move.startBar);
      const endBar = numberField(move.endBar);

      if (
        target === null ||
        action === null ||
        sectionId === null ||
        startBar === null ||
        endBar === null
      ) {
        return null;
      }

      return {
        id: stringField(move.id) ?? `automation-${index}`,
        target,
        move: action,
        sectionId,
        startBar,
        endBar,
      };
    })
    .filter((entry): entry is RenderAutomationMove => entry !== null);
}

export function readPersistedRenderPreview(metrics: Record<string, unknown>): RenderPreview | null {
  const raw = metrics.renderPreview;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const stems = readPersistedRenderStems(record.stems);
  if (stems.length === 0) {
    return null;
  }

  const masterChainRaw = Array.isArray(record.masterChain) ? record.masterChain : [];
  const exportTargetsRaw = Array.isArray(record.exportTargets) ? record.exportTargets : [];

  return {
    mode: stringField(record.mode) ?? "deterministic-stem-preview",
    headroomDb: numberField(record.headroomDb) ?? -6,
    masterChain: masterChainRaw.filter((item): item is string => typeof item === "string"),
    exportTargets: exportTargetsRaw.filter((item): item is string => typeof item === "string"),
    stems,
    automation: readPersistedRenderAutomation(record.automation),
  };
}
