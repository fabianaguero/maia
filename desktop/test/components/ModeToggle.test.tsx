import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModeToggle } from "../../src/components/ModeToggle";
import { UserModeProvider } from "../../src/features/simple/UserModeContext";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderModeToggle() {
  return render(
    <I18nContext.Provider value={en}>
      <UserModeProvider>
        <ModeToggle />
      </UserModeProvider>
    </I18nContext.Provider>,
  );
}

describe("ModeToggle", () => {
  it("switches between basic and pro modes", () => {
    renderModeToggle();

    const basicButton = screen.getByTitle(en.simpleMode.shell.basicMode);
    const proButton = screen.getByTitle(en.simpleMode.shell.proMode);

    expect(basicButton.className).toContain("active");
    expect(proButton.className).not.toContain("active");
    expect(basicButton).toHaveAttribute("aria-pressed", "true");
    expect(proButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(proButton);

    expect(proButton.className).toContain("active");
    expect(basicButton.className).not.toContain("active");
    expect(proButton).toHaveAttribute("aria-pressed", "true");
    expect(basicButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(basicButton);

    expect(basicButton.className).toContain("active");
    expect(proButton.className).not.toContain("active");
    expect(basicButton).toHaveAttribute("aria-pressed", "true");
    expect(proButton).toHaveAttribute("aria-pressed", "false");
  });
});
