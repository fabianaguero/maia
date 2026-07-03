import type { SourceTemplate } from "../config/sourceTemplates";
import { resolveSourceTemplatePresentation } from "../config/sourceTemplates";
import { useT } from "../i18n/I18nContext";

export function MonitorWaveformTemplateChip({
  template,
  liveBpm,
}: {
  template: SourceTemplate | null;
  liveBpm: number | null;
}) {
  const t = useT();
  if (!template) {
    return <span className="template-chip">{t.simpleMode.monitor.synthDefault}</span>;
  }

  const presentation = resolveSourceTemplatePresentation(template, t);
  const showLive = liveBpm != null && Math.abs(liveBpm - template.bpm) > 5;
  const displayText = `${template.icon} ${presentation?.genre ?? template.genre} · ${template.bpm} BPM${
    showLive
      ? ` ${t.simpleMode.monitor.liveTempoShift.replace("{bpm}", String(Math.round(liveBpm)))}`
      : ""
  }`;

  return <span className="template-chip template-chip--active">{displayText}</span>;
}
