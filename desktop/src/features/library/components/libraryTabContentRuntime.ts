import type { LibraryTab } from "../libraryScreenTypes";

export type LibraryTabContentKind =
  | "loading"
  | "empty"
  | "tracks"
  | "sources"
  | "connections"
  | "projects"
  | "bases";

export type LibraryTabEmptyIconKind = "tracks" | "sources" | "connections" | "projects" | "bases";

export interface LibraryTabContentState {
  kind: LibraryTabContentKind;
  emptyIconKind: LibraryTabEmptyIconKind | null;
}

export function resolveLibraryTabEmptyIconKind(tab: LibraryTab): LibraryTabEmptyIconKind {
  if (tab === "tracks") {
    return "tracks";
  }
  if (tab === "sources") {
    return "sources";
  }
  if (tab === "connections") {
    return "connections";
  }
  if (tab === "projects") {
    return "projects";
  }
  return "bases";
}

export function buildLibraryTabContentState(input: {
  tab: LibraryTab;
  loading: boolean;
  trackCount: number;
  repositoryCount: number;
  connectionCount: number;
  codeProjectCount: number;
  baseAssetCount: number;
}): LibraryTabContentState {
  const emptyIconKind = resolveLibraryTabEmptyIconKind(input.tab);

  if (input.loading) {
    return {
      kind: "loading",
      emptyIconKind: null,
    };
  }

  if (input.tab === "tracks") {
    return {
      kind: input.trackCount === 0 ? "empty" : "tracks",
      emptyIconKind,
    };
  }

  if (input.tab === "sources") {
    return {
      kind: input.repositoryCount === 0 ? "empty" : "sources",
      emptyIconKind,
    };
  }

  if (input.tab === "connections") {
    return {
      kind: input.connectionCount === 0 ? "empty" : "connections",
      emptyIconKind,
    };
  }

  if (input.tab === "projects") {
    return {
      kind: input.codeProjectCount === 0 ? "empty" : "projects",
      emptyIconKind,
    };
  }

  return {
    kind: input.baseAssetCount === 0 ? "empty" : "bases",
    emptyIconKind,
  };
}
