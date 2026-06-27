import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppUI } from "../src/AppUI";
import { I18nContext } from "../src/i18n/I18nContext";
import { en } from "../src/i18n/en";
import { UserModeProvider } from "../src/features/simple/UserModeContext";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderAppUI(
  userMode: "simple" | "expert",
  currentSection: "monitor" | "library" | "connections",
) {
  window.localStorage.setItem("maia_user_mode", userMode);
  return render(
    <I18nContext.Provider value={en}>
      <UserModeProvider>
        <AppUI currentSection={currentSection} isMonitoring={currentSection === "monitor"} />
      </UserModeProvider>
    </I18nContext.Provider>,
  );
}

describe("AppUI", () => {
  it("renders section labels per mode", () => {
    renderAppUI("simple", "monitor");
    expect(screen.getAllByText(en.simpleMode.nav.monitor).length).toBeGreaterThan(0);
    cleanup();

    renderAppUI("expert", "library");
    expect(screen.getAllByText(en.nav.library.label).length).toBeGreaterThan(0);
  });

  it("falls back to coming soon for non-primary sections", () => {
    renderAppUI("simple", "connections");
    expect(screen.getByText(en.simpleMode.common.comingSoon)).toBeInTheDocument();
  });
});
