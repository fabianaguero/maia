import { useEffect, type MutableRefObject } from "react";

import { listSessionEvents, type SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";

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
    if (!selectedSessionIdForEvents) {
      setSelectedSessionEvents([]);
      return;
    }

    const loadEvents = async () => {
      try {
        const events = await listSessionEvents(selectedSessionIdForEvents);
        setSelectedSessionEvents(events);
      } catch {
        setSelectedSessionEvents([]);
      }
    };

    void loadEvents();
  }, [selectedSessionIdForEvents, setSelectedSessionEvents]);

  useEffect(() => {
    return () => {
      const audio = boothBedAudioRef.current;
      if (!audio) {
        return;
      }
      audio.pause();
      audio.src = "";
    };
  }, [boothBedAudioRef]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    let audio = boothBedAudioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.2;
      boothBedAudioRef.current = audio;
    }

    if (!activeBedUrl) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      return;
    }

    if (audio.src !== activeBedUrl) {
      audio.pause();
      audio.src = activeBedUrl;
      audio.currentTime = 0;
    }

    void audio.play().catch(() => {});
  }, [activeBedUrl, boothBedAudioRef]);
}
