import { useEffect, useState } from "react";

import { loadBootstrapManifest, runAnalyzerRequest } from "../api/analyzer";
import { createHealthRequest, type AnalyzerResponse, type BootstrapManifest } from "../contracts";

export function useAppContentBootstrap() {
  const [manifest, setManifest] = useState<BootstrapManifest | null>(null);
  const [health, setHealth] = useState<AnalyzerResponse | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));

      try {
        const [nextManifest, nextHealth] = await Promise.all([
          loadBootstrapManifest(),
          Promise.race([runAnalyzerRequest(createHealthRequest()), timeout]),
        ]);

        if (!active) {
          return;
        }

        setManifest(nextManifest ?? null);
        if (nextHealth) {
          setHealth(nextHealth);
        }
      } catch {
        // manifest fallback already handled internally
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return {
    manifest,
    health,
    booting,
  };
}
