import { useEffect, useState } from "react";
import { useUserMode } from "./UserModeContext";

/**
 * ModeTransition: Handles smooth fade between mode switches
 * Prevents jarring UI changes when toggling simple ↔ expert
 */
export function useModeTransition() {
  const { userMode } = useUserMode();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timer);
  }, [userMode]);

  return { isTransitioning, userMode };
}

/**
 * Apply this hook in any component that needs smooth mode transitions
 * Example: const { isTransitioning } = useModeTransition();
 *         className={isTransitioning ? "opacity-transition" : ""}
 */
