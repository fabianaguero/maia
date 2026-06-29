import { SOURCE_TEMPLATES, resolveSourceTemplatePresentation } from "../../config/sourceTemplates";
import { useT } from "../../i18n/I18nContext";

interface SessionTemplatePresetStripProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}

export function SessionTemplatePresetStrip({
  selectedTemplateId,
  onTemplateSelect,
}: SessionTemplatePresetStripProps) {
  const t = useT();
  const selectedTemplate =
    SOURCE_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? null;
  const selectedTemplatePresentation = selectedTemplate
    ? resolveSourceTemplatePresentation(selectedTemplate, t)
    : null;

  return (
    <div className="source-templates">
      <span className="source-templates-label">{t.session.stylePreset}</span>
      <div className="source-template-list">
        {SOURCE_TEMPLATES.map((template) => {
          const presentation = resolveSourceTemplatePresentation(template, t);
          return (
            <button
              key={template.id}
              type="button"
              className={`source-template-card${selectedTemplateId === template.id ? " selected" : ""}`}
              onClick={() => onTemplateSelect(template.id)}
              title={presentation?.hint ?? template.hint}
            >
              <span className="source-template-icon">{template.icon}</span>
              <span className="source-template-name">{presentation?.label ?? template.label}</span>
              <span className="source-template-bpm">{template.bpm} BPM</span>
              <span className="source-template-genre">{presentation?.genre ?? template.genre}</span>
            </button>
          );
        })}
      </div>
      {selectedTemplate ? (
        <p className="source-template-hint">
          {selectedTemplatePresentation?.hint ?? selectedTemplate.hint}
        </p>
      ) : null}
    </div>
  );
}
