import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  resolveRepositorySourcePathError,
  resolveResumeSessionError,
  resolveResumeSessionSource,
  resolveSelectedSessionRepository,
  resolveSessionStartSourceError,
} from "../../../src/features/session/sessionStartPlanSourceRuntime";

const repository = {
  id: "repo-1",
  title: "production.log",
  sourcePath: "/logs/production.log",
  sourceKind: "file",
} as never;

describe("sessionStartPlanSourceRuntime", () => {
  it("resolves validation errors for session start source selection", () => {
    expect(
      resolveSessionStartSourceError({
        baseMode: "track",
        mode: "log",
        selectedPlaylistId: null,
        selectedSourceId: null,
        selectedTrackId: null,
        copy: en,
      }),
    ).toBe(en.session.selectLogSource);

    expect(
      resolveSessionStartSourceError({
        baseMode: "playlist",
        mode: "repo",
        selectedPlaylistId: null,
        selectedSourceId: "repo-1",
        selectedTrackId: null,
        copy: en,
      }),
    ).toBe(en.session.selectBasePlaylist);
  });

  it("resolves selected repository and repository source errors", () => {
    expect(resolveSelectedSessionRepository([repository], "repo-1")).toBe(repository);
    expect(resolveRepositorySourcePathError(null, en)).toBe(en.session.sourceNotFound);
    expect(resolveRepositorySourcePathError({ ...repository, sourceKind: "directory" }, en)).toBe(
      en.session.fileOnlyLiveBooth,
    );
  });

  it("resolves resume source and resume errors", () => {
    const session = {
      id: "session-1",
      sourceId: "repo-1",
      sourcePath: "/logs/production.log",
      adapterKind: "file",
    } as never;

    const resume = resolveResumeSessionSource({
      sessionId: "session-1",
      sessions: [session],
      repositories: [repository],
    });

    expect(resume.session).toBe(session);
    expect(resume.source).toBe(repository);
    expect(resume.sourcePath).toBe("/logs/production.log");

    expect(
      resolveResumeSessionError({
        session,
        sourcePath: null,
        copy: en,
      }),
    ).toBe(en.session.noStoredSourceResume);
  });
});
