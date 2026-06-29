import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "../../src/features/simple/OnboardingWizard";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

function renderWizard(onComplete = vi.fn()) {
  const rendered = render(
    <I18nContext.Provider value={en}>
      <OnboardingWizard onComplete={onComplete} />
    </I18nContext.Provider>,
  );

  return { onComplete, ...rendered };
}

afterEach(() => {
  cleanup();
});

describe("OnboardingWizard", () => {
  it("requires a source path before advancing and updates placeholders by source type", () => {
    renderWizard();

    const continueButton = screen.getByRole("button", { name: en.simpleMode.wizard.continue });
    expect(continueButton).toBeDisabled();
    expect(screen.getByPlaceholderText("/var/log/app.log")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.wizard.sourceGithub }));

    expect(screen.getByPlaceholderText("github.com/org/repo")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "github.com/openai/maia" },
    });

    expect(continueButton).not.toBeDisabled();
  });

  it("completes the full setup flow with the chosen source and preset", () => {
    const { onComplete, getAllByRole, getByRole } = renderWizard();

    fireEvent.click(getAllByRole("button", { name: en.simpleMode.wizard.sourceFolder })[0]!);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "/home/dev/logs" },
    });
    fireEvent.click(getByRole("button", { name: en.simpleMode.wizard.continue }));

    fireEvent.click(screen.getByText(en.simpleMode.wizard.alert).closest("button")!);
    fireEvent.click(getByRole("button", { name: en.simpleMode.wizard.continue }));

    expect(screen.getByText("/home/dev/logs")).toBeInTheDocument();
    expect(screen.getByText("alert")).toBeInTheDocument();

    fireEvent.click(getByRole("button", { name: en.simpleMode.wizard.startButton }));

    expect(onComplete).toHaveBeenCalledWith({
      sourceType: "folder",
      sourcePath: "/home/dev/logs",
      soundPreset: "alert",
    });
  });
});
