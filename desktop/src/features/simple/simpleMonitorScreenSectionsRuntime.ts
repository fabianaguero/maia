import type { SimpleMonitorActiveViewProps } from "./SimpleMonitorActiveView";
import type { SimpleMonitorIdleViewProps } from "./SimpleMonitorIdleView";

export type BuildSimpleMonitorActiveViewPropsArgs = SimpleMonitorActiveViewProps;

export function buildSimpleMonitorActiveViewProps(
  args: BuildSimpleMonitorActiveViewPropsArgs,
): SimpleMonitorActiveViewProps {
  return args;
}

export type BuildSimpleMonitorIdleViewPropsArgs = SimpleMonitorIdleViewProps;

export function buildSimpleMonitorIdleViewProps(
  args: BuildSimpleMonitorIdleViewPropsArgs,
): SimpleMonitorIdleViewProps {
  return args;
}

export type BuildSimpleMonitorScreenSectionsArgs = BuildSimpleMonitorActiveViewPropsArgs &
  BuildSimpleMonitorIdleViewPropsArgs;

function resolveSimpleMonitorActiveSectionArgs(
  args: BuildSimpleMonitorScreenSectionsArgs,
): BuildSimpleMonitorActiveViewPropsArgs {
  return args;
}

function resolveSimpleMonitorIdleSectionArgs(
  args: BuildSimpleMonitorScreenSectionsArgs,
): BuildSimpleMonitorIdleViewPropsArgs {
  return args;
}

export function buildSimpleMonitorScreenSections(args: BuildSimpleMonitorScreenSectionsArgs): {
  activeViewArgs: BuildSimpleMonitorActiveViewPropsArgs;
  idleViewArgs: BuildSimpleMonitorIdleViewPropsArgs;
} {
  return {
    activeViewArgs: resolveSimpleMonitorActiveSectionArgs(args),
    idleViewArgs: resolveSimpleMonitorIdleSectionArgs(args),
  };
}
