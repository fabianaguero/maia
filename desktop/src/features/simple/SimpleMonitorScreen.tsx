import React from "react";

import { SimpleMonitorActiveView } from "./SimpleMonitorActiveView";
import { SimpleMonitorIdleView } from "./SimpleMonitorIdleView";
import {
  useSimpleMonitorScreenState,
  type SimpleMonitorScreenStateInput,
} from "./useSimpleMonitorScreenState";

export function SimpleMonitorScreen(props: SimpleMonitorScreenStateInput) {
  const { isMonitorActive, activeViewProps, idleViewProps } = useSimpleMonitorScreenState(props);

  return (
    <div className="simple-monitor-screen">
      {isMonitorActive ? (
        <SimpleMonitorActiveView {...activeViewProps} />
      ) : (
        <SimpleMonitorIdleView {...idleViewProps} />
      )}
    </div>
  );
}
