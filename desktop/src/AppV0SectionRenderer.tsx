import { ConnectionsScreen } from "./features/simple/ConnectionsScreen";
import { MonitorSetupScreen } from "./features/simple/MonitorSetupScreen";
import { ProLibraryScreen } from "./features/simple/ProLibraryScreen";
import { ProMonitorScreen } from "./features/simple/ProMonitorScreen";
import { SimpleModeLibraryView } from "./features/simple/SimpleModeLibraryView";
import { SimpleMonitorScreen } from "./features/simple/SimpleMonitorScreen";
import {
  buildAppV0FallbackPanelStyle,
  type AppV0SectionRenderModel,
} from "./appV0SectionContentRuntime";

interface AppV0SectionRendererProps {
  renderModel: AppV0SectionRenderModel;
}

export function AppV0SectionRenderer({ renderModel }: AppV0SectionRendererProps) {
  switch (renderModel.kind) {
    case "simple-monitor":
      return <SimpleMonitorScreen {...renderModel.simpleMonitorProps} />;
    case "pro-monitor":
      return <ProMonitorScreen />;
    case "simple-library":
      return (
        <div style={{ display: "flex", gap: "2rem", height: "100%" }}>
          <div style={{ flex: 1 }}>
            <SimpleModeLibraryView {...renderModel.simpleLibraryProps} />
          </div>
        </div>
      );
    case "pro-library":
      return <ProLibraryScreen {...renderModel.proLibraryProps} />;
    case "connections":
      return <ConnectionsScreen {...renderModel.connectionsProps} />;
    case "setup":
      return <MonitorSetupScreen {...renderModel.setupProps} />;
    case "fallback":
    default:
      return (
        <div style={buildAppV0FallbackPanelStyle()}>
          <p>{renderModel.fallbackViewModel.message}</p>
          <p style={{ marginTop: "1rem", fontSize: "12px", color: "#7a8297" }}>
            {renderModel.fallbackViewModel.hint}
          </p>
        </div>
      );
  }
}
