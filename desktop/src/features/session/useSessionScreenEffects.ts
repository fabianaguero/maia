import { useEffect, type MutableRefObject } from "react";

import { listSessionEvents, type SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import {
  cleanupSessionBedAudio,
  ensureSessionBedAudio,
  loadSessionScreenEvents,
  syncSessionBedAudio,
} from "./sessionScreenEffectsRuntime";

interface UseSessionScreenEffectsInput {
  monitorSessionId: string | null;
  subscribeToMonitor: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  setLatestUpdate: (update: LiveLogStreamUpdate | null) => void;
  selectedSessionIdForEvents: string | null;
  setSelectedSessionEvents: (events: SessionEvent[]) => void;
  activeBedUrl: string | null;
  boothBedAudioRef: MutableRefObject<HTMLAudioElement | null>;
}

export function useSessionScreenEffects({
  monitorSessionId,
  subscribeToMonitor,
  setLatestUpdate,
  selectedSessionIdForEvents,
  setSelectedSessionEvents,
  activeBedUrl,
  boothBedAudioRef,
}: UseSessionScreenEffectsInput) {
  useEffect(() => {
    setLatestUpdate(null);
  }, [monitorSessionId, setLatestUpdate]);

  useEffect(() => {
    return subscribeToMonitor((update) => {
      setLatestUpdate(update);
    });
  }, [setLatestUpdate, subscribeToMonitor]);

  useEffect(() => {
    const loadEvents = async () => {
      const events = await loadSessionScreenEvents(selectedSessionIdForEvents, listSessionEvents);
      setSelectedSessionEvents(events);
    };

    void loadEvents();
  }, [selectedSessionIdForEvents, setSelectedSessionEvents]);

  useEffect(() => {
    return () => {
      cleanupSessionBedAudio(boothBedAudioRef);
    };
  }, [boothBedAudioRef]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    const audio = ensureSessionBedAudio(boothBedAudioRef, () => new Audio());
    void syncSessionBedAudio(audio, activeBedUrl);
  }, [activeBedUrl, boothBedAudioRef]);
}
