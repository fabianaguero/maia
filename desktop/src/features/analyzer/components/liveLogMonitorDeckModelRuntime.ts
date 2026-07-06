import type { Dispatch, SetStateAction } from "react";

import {
  buildLiveLogMonitorDeckModelReturnValue,
  buildLiveLogMonitorDeckSectionContentInput,
  buildLiveLogMonitorLiveDeckPropsInput,
  buildLiveLogMonitorPanelViewModelInput,
  buildLiveLogMonitorRoutingPanelInput,
  buildLiveLogMonitorScenePanelInput,
} from "./liveLogMonitorDeckModelBridge";
import { buildLiveLogMonitorPanelViewModel } from "./liveLogMonitorPanelViewModel";
import {
  buildLiveLogMonitorDeckSectionContent,
  buildLiveLogMonitorLiveDeckProps,
  buildLiveLogMonitorRoutingPanel,
  buildLiveLogMonitorScenePanel,
} from "./liveLogMonitorDeckPropsViewModel";
import { updateLiveLogMonitorComponentOverrides } from "./liveLogMonitorRoutingRuntime";
import type { ComponentOverride } from "./liveSonificationScene";
import type { UseLiveLogMonitorDeckModelInput } from "./useLiveLogMonitorDeckModel";

export function buildLiveLogMonitorComponentOverrideUpdater(
  component: string,
  override: ComponentOverride,
) {
  return (current: Map<string, ComponentOverride>) =>
    updateLiveLogMonitorComponentOverrides(current, component, override);
}

export function applyLiveLogMonitorComponentOverride(input: {
  setComponentOverrides: Dispatch<SetStateAction<Map<string, ComponentOverride>>>;
  component: string;
  override: ComponentOverride;
}) {
  input.setComponentOverrides(
    buildLiveLogMonitorComponentOverrideUpdater(input.component, input.override),
  );
}

export function buildLiveLogMonitorDeckModelState(input: {
  deckInput: UseLiveLogMonitorDeckModelInput;
  onOverrideChange: (component: string, override: ComponentOverride) => void;
}) {
  const panelViewState = buildLiveLogMonitorPanelViewModel(
    buildLiveLogMonitorPanelViewModelInput(input.deckInput),
  );

  const activeDeckContent = buildLiveLogMonitorDeckSectionContent(
    buildLiveLogMonitorDeckSectionContentInput(input.deckInput, panelViewState),
  );

  const scenePanel = buildLiveLogMonitorScenePanel(
    buildLiveLogMonitorScenePanelInput(input.deckInput),
  );

  const routingPanel = buildLiveLogMonitorRoutingPanel(
    buildLiveLogMonitorRoutingPanelInput({
      knownComponents: input.deckInput.knownComponents,
      componentOverrides: input.deckInput.componentOverrides,
      liveActive: input.deckInput.sessionRepoId === input.deckInput.repository.id,
      onOverrideChange: input.onOverrideChange,
    }),
  );

  const liveDeckProps = buildLiveLogMonitorLiveDeckProps(
    buildLiveLogMonitorLiveDeckPropsInput(
      input.deckInput,
      panelViewState,
      activeDeckContent,
      scenePanel,
      routingPanel,
    ),
  );

  return buildLiveLogMonitorDeckModelReturnValue(panelViewState, liveDeckProps);
}
