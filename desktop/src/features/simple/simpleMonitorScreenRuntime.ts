import type { PersistedSession } from "../../api/sessions";
import { sortMonitorSessions } from "./monitorSessions";
import type { SimpleMonitorActiveViewProps } from "./SimpleMonitorActiveView";
import type { SimpleMonitorIdleViewProps } from "./SimpleMonitorIdleView";
import {
  buildSimpleMonitorActiveViewProps,
  buildSimpleMonitorIdleViewProps,
  buildSimpleMonitorScreenSections,
  type BuildSimpleMonitorActiveViewPropsArgs,
  type BuildSimpleMonitorIdleViewPropsArgs,
  type BuildSimpleMonitorScreenSectionsArgs,
} from "./simpleMonitorScreenSectionsRuntime";

export function createToggleAnomalyFilterHandler(options: {
  toggleAnomalyFilter: (updater: (value: boolean) => boolean) => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: (() => void) | undefined;
}): () => void {
  return () => {
    options.toggleAnomalyFilter((value) => !value);
    if (!options.isConsoleExpanded) {
      options.onToggleConsole?.();
    }
  };
}

export function createClearAnomalyFilterHandler(
  setAnomalyFilterActive: (value: boolean) => void,
): () => void {
  return () => setAnomalyFilterActive(false);
}

interface BuildSimpleMonitorScreenStateViewModelArgs {
  isMonitorActive: boolean;
  activeViewArgs: BuildSimpleMonitorActiveViewPropsArgs;
  idleViewArgs: BuildSimpleMonitorIdleViewPropsArgs;
}
export {
  buildSimpleMonitorActiveViewProps,
  buildSimpleMonitorIdleViewProps,
  buildSimpleMonitorScreenSections,
};

export function buildSimpleMonitorScreenStateViewModel(
  args: BuildSimpleMonitorScreenStateViewModelArgs,
): {
  isMonitorActive: boolean;
  activeViewProps: SimpleMonitorActiveViewProps;
  idleViewProps: SimpleMonitorIdleViewProps;
} {
  return {
    isMonitorActive: args.isMonitorActive,
    activeViewProps: buildSimpleMonitorActiveViewProps(args.activeViewArgs),
    idleViewProps: buildSimpleMonitorIdleViewProps(args.idleViewArgs),
  };
}

export interface BuildSimpleMonitorScreenHookStateArgs extends Omit<
  BuildSimpleMonitorScreenSectionsArgs,
  "sessions"
> {
  isMonitorActive: boolean;
  sessions: PersistedSession[];
}

export function buildSimpleMonitorScreenHookState(args: BuildSimpleMonitorScreenHookStateArgs): {
  isMonitorActive: boolean;
  activeViewProps: SimpleMonitorActiveViewProps;
  idleViewProps: SimpleMonitorIdleViewProps;
} {
  const sections = buildSimpleMonitorScreenSections({
    ...args,
    sessions: sortMonitorSessions(args.sessions),
  });

  return buildSimpleMonitorScreenStateViewModel({
    isMonitorActive: args.isMonitorActive,
    activeViewArgs: sections.activeViewArgs,
    idleViewArgs: sections.idleViewArgs,
  });
}
