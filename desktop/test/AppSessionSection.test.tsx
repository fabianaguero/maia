import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppSessionSection } from "../src/AppSessionSection";

const sessionScreenMock = vi.hoisted(() => ({
  SessionScreen: vi.fn(),
}));

vi.mock("../src/features/session/SessionScreen", () => ({
  SessionScreen: (props: Record<string, unknown>) => {
    sessionScreenMock.SessionScreen(props);
    return <div data-testid="session-screen">session-screen</div>;
  },
}));

describe("AppSessionSection", () => {
  it("maps monitor session state into SessionScreen props", () => {
    const session = {
      sessionId: "live-1",
      persistedSessionId: "persisted-1",
      repoTitle: "visits-service",
    };

    render(
      <AppSessionSection
        monitorSession={session as never}
        monitorIsPlayback={true}
        monitorPlaybackProgress={0.42}
        tracks={[]}
        playlists={[]}
        repositories={[]}
        sessions={[]}
        sessionBookmarksBySessionId={{}}
        selectedSessionId="persisted-1"
        sessionsLoading={false}
        sessionsMutating={true}
        sessionsError="boom"
        onStartSession={vi.fn(async () => true)}
        onStopSession={vi.fn(async () => undefined)}
        onResumeSession={vi.fn()}
        onPlaybackSession={vi.fn(async () => true)}
        onReplayBookmark={vi.fn(async () => true)}
        onDeleteSession={vi.fn(async () => undefined)}
        onSelectSession={vi.fn()}
      />,
    );

    expect(screen.getByTestId("session-screen")).toBeInTheDocument();
    expect(sessionScreenMock.SessionScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        activeSessionId: "persisted-1",
        activeSessionMode: "playback",
        activePlaybackProgress: 0.42,
        loading: false,
        mutating: true,
        error: "boom",
        selectedSessionId: "persisted-1",
      }),
    );
  });

  it("falls back to the live session id and clears playback progress outside replay mode", () => {
    render(
      <AppSessionSection
        monitorSession={
          {
            sessionId: "live-2",
            persistedSessionId: null,
          } as never
        }
        monitorIsPlayback={false}
        monitorPlaybackProgress={0.75}
        tracks={[]}
        playlists={[]}
        repositories={[]}
        sessions={[]}
        sessionBookmarksBySessionId={{}}
        selectedSessionId={null}
        sessionsLoading={true}
        sessionsMutating={false}
        sessionsError={null}
        onStartSession={vi.fn(async () => true)}
        onStopSession={vi.fn(async () => undefined)}
        onResumeSession={vi.fn()}
        onPlaybackSession={vi.fn(async () => true)}
        onReplayBookmark={vi.fn(async () => true)}
        onDeleteSession={vi.fn(async () => undefined)}
        onSelectSession={vi.fn()}
      />,
    );

    expect(sessionScreenMock.SessionScreen).toHaveBeenLastCalledWith(
      expect.objectContaining({
        activeSessionId: "live-2",
        activeSessionMode: "live",
        activePlaybackProgress: null,
        loading: true,
      }),
    );
  });
});
