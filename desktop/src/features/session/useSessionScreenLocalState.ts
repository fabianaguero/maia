import { useRef, useState } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import { type QuickSessionMode, type SessionBaseMode } from "./sessionDisplay";
import {
  resolveInitialSessionBaseMode,
  resolveSessionScreenSelectedTemplateId,
} from "./sessionScreenControllerRuntime";

interface UseSessionScreenLocalStateInput {
  trackCount: number;
}

export function useSessionScreenLocalState({ trackCount }: UseSessionScreenLocalStateInput) {
  const [mode, setMode] = useState<QuickSessionMode>("log");
  const [baseMode, setBaseMode] = useState<SessionBaseMode>(
    resolveInitialSessionBaseMode(trackCount),
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<LiveLogStreamUpdate | null>(null);
  const [directPath, setDirectPath] = useState("");
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    resolveSessionScreenSelectedTemplateId(undefined),
  );
  const [selectedSessionEvents, setSelectedSessionEvents] = useState<SessionEvent[]>([]);
  const boothBedAudioRef = useRef<HTMLAudioElement | null>(null);

  return {
    mode,
    setMode,
    baseMode,
    setBaseMode,
    selectedSourceId,
    setSelectedSourceId,
    selectedTrackId,
    setSelectedTrackId,
    selectedPlaylistId,
    setSelectedPlaylistId,
    sessionLabel,
    setSessionLabel,
    creating,
    setCreating,
    createError,
    setCreateError,
    latestUpdate,
    setLatestUpdate,
    directPath,
    setDirectPath,
    isDirectLoading,
    setIsDirectLoading,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedSessionEvents,
    setSelectedSessionEvents,
    boothBedAudioRef,
  };
}
