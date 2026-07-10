import React from "react";

import { ScreenBusyOverlay } from "../../components/ScreenBusyOverlay";
import { useT } from "../../i18n/I18nContext";
import { SimpleMonitorActiveView } from "./SimpleMonitorActiveView";
import { SimpleMonitorIdleView } from "./SimpleMonitorIdleView";
import {
  useSimpleMonitorScreenState,
  type SimpleMonitorScreenStateInput,
} from "./useSimpleMonitorScreenState";

export function SimpleMonitorScreen(props: SimpleMonitorScreenStateInput) {
  const t = useT();
  const { isMonitorActive, activeViewProps, idleViewProps } = useSimpleMonitorScreenState(props);
  const showBusyOverlay =
    (!isMonitorActive && idleViewProps.isLaunchingMonitor) || activeViewProps.isConnectingMonitor;
  const busyTitle = activeViewProps.isConnectingMonitor
    ? t.simpleMode.monitor.connectingRemoteStream
    : t.simpleMode.setup.connectingToStream;
  const busyDetail = activeViewProps.monitorSourcePath || idleViewProps.startHint;
  const busyBadge = activeViewProps.monitorSourceTitle || t.simpleMode.setup.initializeMonitoring;

  return (
    <div className="simple-monitor-screen">
      <ScreenBusyOverlay
        visible={showBusyOverlay}
        title={busyTitle}
        detail={busyDetail}
        badge={busyBadge}
      />
      {isMonitorActive ? (
        <SimpleMonitorActiveView {...activeViewProps} />
      ) : (
        <SimpleMonitorIdleView {...idleViewProps} />
      )}
    </div>
  );
}
