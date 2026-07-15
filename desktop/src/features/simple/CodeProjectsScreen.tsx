import { useState } from "react";

import { useT } from "../../i18n/I18nContext";
import type { CodeProject } from "../../types/codeProject";
import { useCodeProjectsState } from "../library/useCodeProjectsState";
import { LibraryCodeProjectDrawer } from "../library/components/LibraryCodeProjectDrawer";
import { LibraryCodeProjectsList } from "../library/components/LibraryCodeProjectsList";
import "./CodeProjectsScreen.css";

export function CodeProjectsScreen() {
  const t = useT();
  const { projects, loading, createProject, updateProject, deleteProject, testConnection } =
    useCodeProjectsState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CodeProject | null>(null);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedProject(null);
  };

  return (
    <section className="code-projects-screen">
      <header className="code-projects-screen__hero panel">
        <span className="code-projects-screen__kicker">
          {t.simpleMode.codeProjects.signalSourceKicker}
        </span>
        <div>
          <h1>{t.simpleMode.nav.codeProjects}</h1>
          <p>{t.simpleMode.codeProjects.signalSourceDescription}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSelectedProject(null);
            setDrawerOpen(true);
          }}
        >
          {t.simpleMode.codeProjects.newProject}
        </button>
      </header>

      <div className="code-projects-screen__grid">
        <section className="panel code-projects-screen__panel">
          <div className="code-projects-screen__panel-header">
            <div>
              <span className="code-projects-screen__kicker">
                {t.simpleMode.codeProjects.localMode}
              </span>
              <h2>{t.simpleMode.codeProjects.localScannerTitle}</h2>
            </div>
            <span className="code-projects-screen__badge">
              {t.simpleMode.codeProjects.serverOptional}
            </span>
          </div>
          <p>{t.simpleMode.codeProjects.localScannerDescription}</p>
        </section>

        <section className="panel code-projects-screen__panel">
          <div className="code-projects-screen__panel-header">
            <div>
              <span className="code-projects-screen__kicker">SonarQube</span>
              <h2>{t.simpleMode.codeProjects.connectedMode}</h2>
            </div>
            <span className="code-projects-screen__badge">
              {t.simpleMode.codeProjects.rulesSyncPending}
            </span>
          </div>
          <p>{t.simpleMode.codeProjects.connectedScannerDescription}</p>
        </section>
      </div>

      <section className="panel code-projects-screen__list">
        <div className="code-projects-screen__list-header">
          <div>
            <span className="code-projects-screen__kicker">
              {t.simpleMode.codeProjects.savedProjects}
            </span>
            <h2>{t.simpleMode.codeProjects.title}</h2>
          </div>
          <span className="code-projects-screen__count">{projects.length}</span>
        </div>
        <LibraryCodeProjectsList
          projects={projects}
          loading={loading}
          onNew={() => {
            setSelectedProject(null);
            setDrawerOpen(true);
          }}
          onEdit={(project) => {
            setSelectedProject(project);
            setDrawerOpen(true);
          }}
          onDelete={(project) => deleteProject(project.id)}
        />
      </section>

      <LibraryCodeProjectDrawer
        visible={drawerOpen}
        project={selectedProject ?? undefined}
        onClose={handleCloseDrawer}
        onCreate={createProject}
        onUpdate={updateProject}
        onTestConnection={testConnection}
      />
    </section>
  );
}
