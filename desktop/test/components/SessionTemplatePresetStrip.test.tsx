import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionTemplatePresetStrip } from "../../src/features/session/SessionTemplatePresetStrip";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
});

function renderStrip(selectedTemplateId: string, onTemplateSelect = vi.fn()) {
  render(
    <I18nContext.Provider value={en}>
      <SessionTemplatePresetStrip
        selectedTemplateId={selectedTemplateId}
        onTemplateSelect={onTemplateSelect}
      />
    </I18nContext.Provider>,
  );

  return { onTemplateSelect };
}

describe("SessionTemplatePresetStrip", () => {
  it("renders the selected preset hint and forwards template changes", () => {
    const { onTemplateSelect } = renderStrip("deep-house");

    fireEvent.click(screen.getByRole("button", { name: /peak techno/i }));

    expect(screen.getByText(en.session.stylePreset)).toBeInTheDocument();
    expect(
      screen.getByText("Ideal for Spring Boot / JVM log files during business hours."),
    ).toBeInTheDocument();
    expect(onTemplateSelect).toHaveBeenCalledWith("peak-techno");
  });

  it("omits the selected hint when the chosen template does not exist", () => {
    renderStrip("missing-template");

    expect(screen.queryByText("Ideal for Spring Boot / JVM log files during business hours.")).toBeNull();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});
