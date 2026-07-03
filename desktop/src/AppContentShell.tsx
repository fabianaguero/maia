import { Suspense } from "react";

import { AppSectionContent } from "./AppSectionContent";
import { AppMonitorOverview } from "./components/AppMonitorOverview";
import { AppSidebar } from "./components/AppSidebar";
import { AppTopbar } from "./components/AppTopbar";
import { Web3Spinner } from "./components/Web3Spinner";
import type { useAppContentController } from "./hooks/useAppContentController";
import {
  buildAppMonitorOverviewProps,
  buildAppSectionContentProps,
  buildAppShellLayoutState,
  buildAppShellSpinnerState,
  buildAppSidebarProps,
  buildAppTopbarProps,
} from "./appShellPropsRuntime";

interface AppContentShellProps {
  userMode: "simple" | "expert";
  controller: ReturnType<typeof useAppContentController>;
}

export function AppContentShell({ userMode, controller }: AppContentShellProps) {
  const spinnerState = buildAppShellSpinnerState({
    booting: controller.booting,
    isMutating: controller.isMutating,
    bootingLabel: controller.t.appShell.bootingMaia,
    mutateLabel: controller.mutateLabel,
  });
  const layoutState = buildAppShellLayoutState({
    pillar: controller.pillar,
    isTransitioning: controller.isTransitioning,
    userMode,
  });
  const topbarProps = buildAppTopbarProps(controller, userMode);
  const monitorOverviewProps = buildAppMonitorOverviewProps(controller, userMode);
  const sidebarProps = buildAppSidebarProps(controller);
  const sectionContentProps = buildAppSectionContentProps(controller, userMode);

  return (
    <>
      <Web3Spinner visible={spinnerState.visible} label={spinnerState.label} />
      <main className="app-shell">
        <AppTopbar {...topbarProps} />

        <AppMonitorOverview {...monitorOverviewProps} />

        <section className={layoutState.mainClassName} key={layoutState.mainKey}>
          <AppSidebar {...sidebarProps} />

          {controller.health?.warnings.length ? (
            <section className="notice inline-notice">
              {controller.health.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </section>
          ) : null}

          <Suspense
            fallback={
              <section className="notice inline-notice">
                <p>{controller.t.simpleMode.status.loading}</p>
              </section>
            }
          >
            <AppSectionContent {...sectionContentProps} />
          </Suspense>
        </section>
      </main>
    </>
  );
}
