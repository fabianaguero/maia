import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MonitorSetupScreen } from "../../src/features/simple/MonitorSetupScreen";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../src/features/simple/monitorSetupPreferences";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderSetup(overrides: Partial<React.ComponentProps<typeof MonitorSetupScreen>> = {}) {
  const onChangeLanguage = vi.fn();
  const onChangeSkin = vi.fn();
  const onUpdateSetupPreference = vi.fn();

  const view = render(
    <I18nContext.Provider value={en}>
      <MonitorSetupScreen
        lang="en"
        skin="nightfall"
        onChangeLanguage={onChangeLanguage}
        onChangeSkin={onChangeSkin}
        setupPreferences={DEFAULT_MONITOR_SETUP_PREFERENCES}
        onUpdateSetupPreference={onUpdateSetupPreference}
        {...overrides}
      />
    </I18nContext.Provider>,
  );

  return {
    ...view,
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

  it("keeps an independent persisted deck profile per skin", async () => {
    const setup = renderSetup();

    const waveZoom = await screen.findByRole("slider", { name: /Wave zoom/i });
    fireEvent.change(waveZoom, { target: { value: "1.7" } });

    await waitFor(() => {
      expect(screen.getByRole("slider", { name: /Wave zoom/i })).toHaveValue("1.7");
    });

    setup.rerender(
      <I18nContext.Provider value={en}>
        <MonitorSetupScreen
          lang="en"
          skin="arctic"
          onChangeLanguage={setup.onChangeLanguage}
          onChangeSkin={setup.onChangeSkin}
          setupPreferences={DEFAULT_MONITOR_SETUP_PREFERENCES}
          onUpdateSetupPreference={setup.onUpdateSetupPreference}
        />
      </I18nContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("slider", { name: /Wave zoom/i })).toHaveValue("1.7");
    });

    fireEvent.change(screen.getByRole("slider", { name: /Wave zoom/i }), {
      target: { value: "2.3" },
    });

    await waitFor(() => {
      expect(screen.getByRole("slider", { name: /Wave zoom/i })).toHaveValue("2.3");
    });

    setup.rerender(
      <I18nContext.Provider value={en}>
        <MonitorSetupScreen
          lang="en"
          skin="nightfall"
          onChangeLanguage={setup.onChangeLanguage}
          onChangeSkin={setup.onChangeSkin}
          setupPreferences={DEFAULT_MONITOR_SETUP_PREFERENCES}
          onUpdateSetupPreference={setup.onUpdateSetupPreference}
        />
      </I18nContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("slider", { name: /Wave zoom/i })).toHaveValue("1.7");
    });

    setup.rerender(
      <I18nContext.Provider value={en}>
        <MonitorSetupScreen
          lang="en"
          skin="arctic"
          onChangeLanguage={setup.onChangeLanguage}
          onChangeSkin={setup.onChangeSkin}
          setupPreferences={DEFAULT_MONITOR_SETUP_PREFERENCES}
          onUpdateSetupPreference={setup.onUpdateSetupPreference}
        />
      </I18nContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("slider", { name: /Wave zoom/i })).toHaveValue("2.3");
    });
  });

  it("dispatches runtime default edits from the setup rack", async () => {
    const { onUpdateSetupPreference } = renderSetup();

    const idleHoldInput = await screen.findByDisplayValue("900");
    const tailWindowRowsInput = screen.getByDisplayValue("1200");

    fireEvent.change(idleHoldInput, { target: { value: "1400" } });
    fireEvent.change(tailWindowRowsInput, { target: { value: "1800" } });

    expect(onUpdateSetupPreference).toHaveBeenCalledWith("idleHoldMs", 1400);
    expect(onUpdateSetupPreference).toHaveBeenCalledWith("tailWindowRows", 1800);
  });
});
