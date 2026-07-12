import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useT } from "../../../i18n/I18nContext";
import {
  createEmptyCodeProjectDraft,
  createCodeProjectDraftFromProject,
  createUpsertCodeProjectInputFromDraft,
} from "../codeProjectsViewModel";
import { LibraryCodeProjectForm } from "./LibraryCodeProjectForm";
import { CodeProjectSonarQubeConfigForm } from "./CodeProjectSonarQubeConfigForm";
import type {
  CodeProject,
  CodeProjectFormDraft,
  UpsertCodeProjectInput,
} from "../../../types/codeProject";
import "./LibraryCodeProjectDrawer.css";

interface LibraryCodeProjectDrawerProps {
  visible: boolean;
  project?: CodeProject; // undefined = create mode
  onClose: () => void;
  onCreate: (label: string, repoUrl: string) => Promise<CodeProject>;
  onUpdate: (id: string, input: UpsertCodeProjectInput) => Promise<CodeProject>;
  onTestConnection: (
    apiUrl: string,
    projectKey: string,
    authToken: string,
  ) => Promise<{ valid: boolean; error?: string; issueCount?: number }>;
}

type DrawerStep = "create" | "configure";

export function LibraryCodeProjectDrawer({
  visible,
  project,
  onClose,
  onCreate,
  onUpdate,
  onTestConnection,
}: LibraryCodeProjectDrawerProps) {
  const t = useT();
  const [step, setStep] = useState<DrawerStep>("create");
  const [draft, setDraft] = useState<CodeProjectFormDraft>(
    createEmptyCodeProjectDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [createdProject, setCreatedProject] = useState<CodeProject | null>(null);

  useEffect(() => {
    if (visible) {
      if (project) {
        setStep("configure");
        setDraft(createCodeProjectDraftFromProject(project));
        setCreatedProject(project);
      } else {
        setStep("create");
        setDraft(createEmptyCodeProjectDraft());
        setCreatedProject(null);
      }
    }
  }, [visible, project]);

  const handleDraftChange = useCallback(
    (patch: Partial<CodeProjectFormDraft>) => {
      setDraft((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleCreateSubmit = useCallback(async () => {
    setSaving(true);
    try {
      const created = await onCreate(draft.label, draft.repositoryUrl);
      setCreatedProject(created);
      setDraft(createCodeProjectDraftFromProject(created));
      setStep("configure");
    } finally {
      setSaving(false);
    }
  }, [draft, onCreate]);

  const handleConfigureSubmit = useCallback(async () => {
    if (!createdProject) return;
    setSaving(true);
    try {
      const input = createUpsertCodeProjectInputFromDraft(draft);
      await onUpdate(createdProject.id, input);
      onClose();
    } finally {
      setSaving(false);
    }
  }, [createdProject, draft, onUpdate, onClose]);

  const handleClose = useCallback(() => {
    setStep("create");
    setDraft(createEmptyCodeProjectDraft());
    setCreatedProject(null);
    onClose();
  }, [onClose]);

  return (
    <>
      {visible && <div className="drawer-backdrop" onClick={handleClose} />}
      <div className={`drawer ${visible ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>
            {step === "create"
              ? t.simpleMode.codeProjects.newProject
              : t.simpleMode.codeProjects.configureSonarQube}
          </h3>
          <button
            className="close-button"
            onClick={handleClose}
            aria-label={t.simpleMode.common.close}
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {step === "create" ? (
            <LibraryCodeProjectForm
              draft={draft}
              onDraftChange={handleDraftChange}
              onSubmit={handleCreateSubmit}
              onCancel={handleClose}
              saving={saving}
            />
          ) : (
            <CodeProjectSonarQubeConfigForm
              draft={draft}
              onDraftChange={handleDraftChange}
              onTestConnection={onTestConnection}
              onSubmit={handleConfigureSubmit}
              onCancel={handleClose}
              saving={saving}
            />
          )}
        </div>
      </div>
    </>
  );
}
