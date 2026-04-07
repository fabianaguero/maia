import { useState } from "react";

import {
  exportCompositionFile,
  exportCompositionStems,
  pickExportSavePath,
  pickStemsExportDirectory,
} from "../../../api/repositories";
import type { CompositionResultRecord } from "../../../types/library";

interface ExportCompositionPanelProps {
  composition: CompositionResultRecord;
}

type ExportStatus = "idle" | "exporting" | "done" | "error";

interface ExportState {
  status: ExportStatus;
  message: string;
}

const IDLE: ExportState = { status: "idle", message: "" };

function triggerBrowserDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export function ExportCompositionPanel({
  composition,
}: ExportCompositionPanelProps) {
  const [planState, setPlanState] = useState<ExportState>(IDLE);
  const [audioState, setAudioState] = useState<ExportState>(IDLE);
  const [stemsState, setStemsState] = useState<ExportState>(IDLE);

  async function handleExportStems() {
    setStemsState({ status: "exporting", message: "" });
    try {
      const destDir = await pickStemsExportDirectory();
      if (!destDir) {
        setStemsState(IDLE);
        return;
      }
      const result = await exportCompositionStems(composition.id, destDir);
      const count = result.stems.length;
      setStemsState({
        status: "done",
        message: `${count} stem${count === 1 ? "" : "s"} written to ${destDir}`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setStemsState({ status: "error", message: msg });
    }
  }

  async function handleExportPlan() {
    if (!composition.exportPath) return;
    setPlanState({ status: "exporting", message: "" });
    try {
      const dest = await pickExportSavePath("plan.json");
      if (!dest) {
        setPlanState(IDLE);
        return;
      }
      await exportCompositionFile(composition.exportPath, dest);
      setPlanState({ status: "done", message: `Saved to ${dest}` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("tauri") || msg.includes("__TAURI_INTERNALS__")) {
        // Browser fallback — directly download the path text as a placeholder
        triggerBrowserDownload(
          `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ exportPath: composition.exportPath }, null, 2))}`,
          "plan.json",
        );
        setPlanState({ status: "done", message: "Downloaded via browser fallback." });
      } else {
        setPlanState({ status: "error", message: msg });
      }
    }
  }

  async function handleExportAudio() {
    if (!composition.previewAudioPath) return;
    const defaultName = `${composition.title.replace(/[^a-z0-9_-]/gi, "_")}_preview.wav`;
    setAudioState({ status: "exporting", message: "" });
    try {
      const dest = await pickExportSavePath(defaultName);
      if (!dest) {
        setAudioState(IDLE);
        return;
      }
      await exportCompositionFile(composition.previewAudioPath, dest);
      setAudioState({ status: "done", message: `Saved to ${dest}` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("tauri") || msg.includes("__TAURI_INTERNALS__")) {
        triggerBrowserDownload(composition.previewAudioPath, defaultName);
        setAudioState({ status: "done", message: "Downloaded via browser fallback." });
      } else {
        setAudioState({ status: "error", message: msg });
      }
    }
  }

  const hasPlan = Boolean(composition.exportPath);
  const hasAudio = Boolean(composition.previewAudioPath);

  return (
    <section className="panel">
      <div className="panel-header compact">
        <div>
          <h2>Export</h2>
          <p className="support-copy">
            Save the composition artifacts to disk.
          </p>
        </div>
      </div>

      <div className="export-actions">
        {hasPlan && (
          <div className="export-row">
            <button
              className="action"
              disabled={planState.status === "exporting"}
              onClick={() => void handleExportPlan()}
              type="button"
            >
              {planState.status === "exporting" ? "Exporting…" : "Export plan.json"}
            </button>
            {planState.status === "done" && (
              <span className="export-feedback export-feedback--ok">{planState.message}</span>
            )}
            {planState.status === "error" && (
              <span className="export-feedback export-feedback--error">{planState.message}</span>
            )}
          </div>
        )}

        {hasAudio && (
          <div className="export-row">
            <button
              className="action"
              disabled={audioState.status === "exporting"}
              onClick={() => void handleExportAudio()}
              type="button"
            >
              {audioState.status === "exporting" ? "Exporting…" : "Export preview WAV"}
            </button>
            {audioState.status === "done" && (
              <span className="export-feedback export-feedback--ok">{audioState.message}</span>
            )}
            {audioState.status === "error" && (
              <span className="export-feedback export-feedback--error">{audioState.message}</span>
            )}
          </div>
        )}

        <div className="export-row">
          <button
            className="action"
            disabled={stemsState.status === "exporting"}
            onClick={() => void handleExportStems()}
            type="button"
          >
            {stemsState.status === "exporting" ? "Rendering stems…" : "Export stems as WAV"}
          </button>
          {stemsState.status === "done" && (
            <span className="export-feedback export-feedback--ok">{stemsState.message}</span>
          )}
          {stemsState.status === "error" && (
            <span className="export-feedback export-feedback--error">{stemsState.message}</span>
          )}
        </div>
      </div>
    </section>
  );
}
