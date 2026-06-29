import type { ComponentOverride } from "./liveSonificationScene";

export function updateLiveLogMonitorComponentOverrides(
  current: Map<string, ComponentOverride>,
  component: string,
  override: ComponentOverride,
): Map<string, ComponentOverride> {
  const next = new Map(current);
  next.set(component, override);
  return next;
}
