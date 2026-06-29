import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionCreateFooter } from "../../src/features/session/SessionCreateFooter";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
});

function renderFooter(overrides: Partial<ComponentProps<typeof SessionCreateFooter>> = {}) {
  const onSessionLabelChange = vi.fn();
  const onCreateSession = vi.fn();

  render(
    <I18nContext.Provider value={en}>
      <SessionCreateFooter
        baseMode="track"
        selectedSourceId={null}
        selectedTrackId={null}
        selectedPlaylistId={null}
        selectedSourceTitle={null}
        selectedBaseLabel={null}
        sessionLabel=""
        sessionLabelPlaceholder="Night watch"
        creating={false}
        mutating={false}
        onSessionLabelChange={onSessionLabelChange}
        onCreateSession={onCreateSession}
        {...overrides}
      />
    </I18nContext.Provider>,
  );

  return { onSessionLabelChange, onCreateSession };
}

describe("SessionCreateFooter", () => {
  it("shows not-selected readiness and disables start until source and base are armed", () => {
    renderFooter();

    expect(screen.getAllByText(en.session.notSelected).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: /start session/i })).toBeDisabled();
  });

  it("routes label changes and create clicks when the track path is ready", () => {
    const { onSessionLabelChange, onCreateSession } = renderFooter({
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedSourceTitle: "customers-service",
      selectedBaseLabel: "Night shift",
      sessionLabel: "Night watch",
    });

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Night shift live" },
    });
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));

    expect(onSessionLabelChange).toHaveBeenCalledWith("Night shift live");
    expect(screen.getByText("Night shift")).toBeInTheDocument();
    expect(screen.getByText("customers-service")).toBeInTheDocument();
    expect(onCreateSession).toHaveBeenCalledTimes(1);
  });

  it("enables the playlist path and respects creating or mutating lock states", () => {
    const { rerender } = render(
      <I18nContext.Provider value={en}>
        <SessionCreateFooter
          baseMode="playlist"
          selectedSourceId="repo-1"
          selectedTrackId={null}
          selectedPlaylistId="playlist-1"
          selectedSourceTitle="repo-stream"
          selectedBaseLabel="Night watch"
          sessionLabel=""
          sessionLabelPlaceholder="Night watch"
          creating={false}
          mutating={false}
          onSessionLabelChange={vi.fn()}
          onCreateSession={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByRole("button", { name: /start session/i })).toBeEnabled();

    rerender(
      <I18nContext.Provider value={en}>
        <SessionCreateFooter
          baseMode="playlist"
          selectedSourceId="repo-1"
          selectedTrackId={null}
          selectedPlaylistId="playlist-1"
          selectedSourceTitle="repo-stream"
          selectedBaseLabel="Night watch"
          sessionLabel=""
          sessionLabelPlaceholder="Night watch"
          creating
          mutating={false}
          onSessionLabelChange={vi.fn()}
          onCreateSession={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByRole("button", { name: /start session/i })).toBeDisabled();
  });
});
