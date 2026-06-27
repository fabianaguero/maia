import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MonitorSetupScreen } from "../../src/features/simple/MonitorSetupScreen";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../src/features/simple/monitorSetupPreferences";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderSetup() {
  const onChangeLanguage = vi.fn();
  const onChangeSkin = vi.fn();
  const onUpdateSetupPreference = vi.fn();

  render(
    <I18nContext.Provider value={en}>
      <MonitorSetupScreen
        lang="en"
        skin="nightfall"
        onChangeLanguage={onChangeLanguage}
        onChangeSkin={onChangeSkin}
        setupPreferences={DEFAULT_MONITOR_SETUP_PREFERENCES}
        onUpdateSetupPreference={onUpdateSetupPreference}
      />
    </I18nContext.Provider>,
  );

  return {
    onChangeLanguage,
    onChangeSkin,
    onUpdateSetupPreference,
  };
}

describe("MonitorSetupScreen", () => {
  it("renders the deck setup surface and core control racks", async () => {
    renderSetup();

    await screen.findByText(en.simpleMode.deckSetup.title);
    expect(screen.getByText(en.simpleMode.deckSetup.languageTitle)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.deckSetup.skinTitle)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.deckSetup.editableControls)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.deckSetup.runtimeDefaultsTitle)).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /Wave zoom/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /Reactive mix/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /Monitor level/i })).toBeInTheDocument();
  });

  it("dispatches language and skin changes from the setup banks", async () => {
    const { onChangeLanguage, onChangeSkin } = renderSetup();

    await screen.findByRole("button", { name: /EN · English/i });
    fireEvent.click(screen.getByRole("button", { name: /ES · Spanish/i }));
    fireEvent.click(screen.getByRole("listitem", { name: en.simpleMode.deckSetup.skinArctic }));

    expect(onChangeLanguage).toHaveBeenCalledWith("es");
    expect(onChangeSkin).toHaveBeenCalledWith("arctic");
  });
});
