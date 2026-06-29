import type { AppSection } from "./features/simple/appSections";

type UserMode = "simple" | "expert";

interface AppUICopy {
  nav: {
    library: { label: string };
    session: { label: string };
  };
  simpleMode: {
    common: { comingSoon: string };
    nav: {
      files: string;
      monitor: string;
    };
  };
}

export function resolveAppUIContentLabel(
  currentSection: AppSection,
  userMode: UserMode,
  t: AppUICopy,
): string {
  if (currentSection === "monitor") {
    return userMode === "simple" ? t.simpleMode.nav.monitor : t.nav.session.label;
  }

  if (currentSection === "library") {
    return userMode === "simple" ? t.simpleMode.nav.files : t.nav.library.label;
  }

  return t.simpleMode.common.comingSoon;
}
