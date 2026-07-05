import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  SessionSavedSessionCard: vi.fn((props: { session: { id: string; label?: string | null } }) => (
    <div data-testid="saved-session-card">{props.session.id}</div>
  )),
}));

vi.mock("../../../src/features/session/SessionSavedSessionCard", () => ({
  SessionSavedSessionCard: mocks.SessionSavedSessionCard,
}));

import { SessionSavedSessionsList } from "../../../src/features/session/SessionSavedSessionsList";

describe("SessionSavedSessionsList", () => {
  it("renders loading and empty states", () => {
    const baseProps = {
      sessions: [],
      loading: false,
      mutating: false,
      selectedSessionId: null,
      activeSessionId: null,
      activeSessionMode: null,
      sessionBookmarksBySessionId: {},
      liveWindowCount: 0,
      liveProcessedLines: 0,
      liveTotalAnomalies: 0,
      emptyLabel: "No sessions yet",
      loadingLabel: "Loading sessions",
      onSelectSession: vi.fn(),
      onResumeSession: vi.fn(),
      onPlaybackSession: vi.fn(async () => undefined),
      onDeleteSession: vi.fn(),
    } as const;

    const { rerender } = render(<SessionSavedSessionsList {...baseProps} loading />);
    expect(screen.getByText("Loading sessions")).toBeInTheDocument();

    rerender(<SessionSavedSessionsList {...baseProps} />);
    expect(screen.getByText("No sessions yet")).toBeInTheDocument();
  });

  it("renders session cards with derived card props in ready state", () => {
    mocks.SessionSavedSessionCard.mockClear();

    render(
      <SessionSavedSessionsList
        sessions={
          [
            { id: "session-1", status: "active" },
            { id: "session-2", status: "paused" },
          ] as never
        }
        loading={false}
        mutating={true}
        selectedSessionId="session-2"
        activeSessionId="session-1"
        activeSessionMode="playback"
        sessionBookmarksBySessionId={{ "session-1": [{ id: 1 }] } as never}
        liveWindowCount={4}
        liveProcessedLines={48}
        liveTotalAnomalies={2}
        emptyLabel="No sessions yet"
        loadingLabel="Loading sessions"
        onSelectSession={vi.fn()}
        onResumeSession={vi.fn()}
        onPlaybackSession={vi.fn(async () => undefined)}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId("saved-session-card")).toHaveLength(2);
    expect(mocks.SessionSavedSessionCard).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        session: expect.objectContaining({ id: "session-1" }),
        active: true,
        playbackActive: true,
        selected: false,
        mutating: true,
        liveProcessedLines: 48,
      }),
      undefined,
    );
    expect(mocks.SessionSavedSessionCard).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        session: expect.objectContaining({ id: "session-2" }),
        active: false,
        selected: true,
      }),
      undefined,
    );
  });
});
