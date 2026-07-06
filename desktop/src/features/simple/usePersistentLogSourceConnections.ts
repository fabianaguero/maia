import { useEffect, useState } from "react";

import { listLogSourceConnections } from "../../api/repositories";
import type { LogSourceConnection } from "../../types/monitor";
import { normalizePersistentLogSourceConnections } from "./persistentLogSourceConnectionsRuntime";

export function usePersistentLogSourceConnections() {
  const [persistentConnections, setPersistentConnections] = useState<LogSourceConnection[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextConnections = await listLogSourceConnections();
        if (!cancelled) {
          setPersistentConnections(normalizePersistentLogSourceConnections(nextConnections));
        }
      } catch {
        if (!cancelled) {
          setPersistentConnections([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return persistentConnections;
}
