import type { ComponentProps, ReactNode } from "react";

import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";
import { ComponentRoutingPanel } from "./ComponentRoutingPanel";
import { LiveSonificationScenePanel } from "./LiveSonificationScenePanel";
import type { ComponentOverride } from "./liveSonificationScene";

export interface BuildLiveLogMonitorScenePanelInput {
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  scene: ComponentProps<typeof LiveSonificationScenePanel>["scene"];
  onSceneBaseAssetIdChange: (value: string) => void;
  onSceneCompositionIdChange: (value: string) => void;
}

export function buildLiveLogMonitorScenePanel(
  input: BuildLiveLogMonitorScenePanelInput,
): ReactNode {
  return (
    <LiveSonificationScenePanel
      availableBaseAssets={input.availableBaseAssets}
      availableCompositions={input.availableCompositions}
      sceneBaseAssetId={input.sceneBaseAssetId}
      sceneCompositionId={input.sceneCompositionId}
      onSceneBaseAssetIdChange={input.onSceneBaseAssetIdChange}
      onSceneCompositionIdChange={input.onSceneCompositionIdChange}
      scene={input.scene}
    />
  );
}

export interface BuildLiveLogMonitorRoutingPanelInput {
  knownComponents: string[];
  overrides: Map<string, ComponentOverride>;
  liveActive: boolean;
  onOverrideChange: (component: string, override: ComponentOverride) => void;
}

export function buildLiveLogMonitorRoutingPanel(
  input: BuildLiveLogMonitorRoutingPanelInput,
): ReactNode {
  return (
    <ComponentRoutingPanel
      knownComponents={input.knownComponents}
      overrides={input.overrides}
      liveActive={input.liveActive}
      onOverrideChange={input.onOverrideChange}
    />
  );
}
