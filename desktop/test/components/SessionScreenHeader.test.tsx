import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SessionScreenHeader } from "../../src/features/session/SessionScreenHeader";
import type { PersistedSession } from "../../src/api/sessions";

afterEach(() => {
  cleanup();
});

describe("SessionScreenHeader", () => {
  it("renders saved session count and active session label", () => {
    render(
      <SessionScreenHeader
        sessionsCount={3}
        activeSession={
          {
            id: "session-1",
            label: "Night watch",
          } as PersistedSession
        }
      />,
    );

    expect(screen.getByText("Saved Sessions")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Night watch")).toBeInTheDocument();
  });

  it("omits the active pill when there is no active session", () => {
    render(<SessionScreenHeader sessionsCount={0} activeSession={null} />);

    expect(screen.getByText("Saved Sessions")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });
});
