import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppTopbar } from "../../src/components/AppTopbar";

vi.mock("../../src/components/Branding", () => ({
  BrandLockup: (props: { className?: string; wordmarkClassName?: string }) => (
    <div
      data-testid="brand-lockup"
      data-class={props.className}
      data-wordmark={props.wordmarkClassName}
    >
      brand-lockup
    </div>
  ),
  BrandWordmark: (props: { className?: string }) => (
    <div data-testid="brand-wordmark" data-class={props.className}>
      brand-wordmark
    </div>
  ),
}));

describe("AppTopbar", () => {
  afterEach(() => {
    cleanup();
  });

  const controls = {
    lang: "Toggle language",
    english: "English",
    spanish: "Spanish",
    dark: "Dark theme",
    light: "Light theme",
  };

  it("renders the simple topbar layout with lockup and no workspace subtitle", () => {
    render(
      <AppTopbar
        isDark={true}
        lang="en"
        userMode="simple"
        workspaceLabel="Dev workspace"
        controls={controls}
        onToggleLanguage={vi.fn()}
        onToggleTheme={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("brand-wordmark")).not.toBeInTheDocument();
    expect(screen.getByTestId("brand-lockup")).toBeInTheDocument();
    expect(screen.queryByText("Dev workspace")).not.toBeInTheDocument();
    expect(screen.getByTitle("Toggle language")).toBeInTheDocument();
    expect(screen.getByTitle("Light theme")).toBeInTheDocument();
    expect(screen.getByText("Spanish")).toHaveClass("sr-only");
  });

  it("renders the expert layout with wordmark, workspace subtitle, and interactive controls", () => {
    const onToggleLanguage = vi.fn();
    const onToggleTheme = vi.fn();

    render(
      <AppTopbar
        isDark={false}
        lang="es"
        userMode="expert"
        workspaceLabel="Observability deck"
        controls={controls}
        onToggleLanguage={onToggleLanguage}
        onToggleTheme={onToggleTheme}
      />,
    );

    expect(screen.getByTestId("brand-wordmark")).toBeInTheDocument();
    expect(screen.queryByTestId("brand-lockup")).not.toBeInTheDocument();
    expect(screen.getByText("Observability deck")).toBeInTheDocument();
    expect(screen.getByText("English")).toHaveClass("sr-only");
    expect(screen.getByTitle("Dark theme")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Toggle language"));
    fireEvent.click(screen.getByTitle("Dark theme"));

    expect(onToggleLanguage).toHaveBeenCalledTimes(1);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
