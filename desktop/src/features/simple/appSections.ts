export const APP_SECTIONS = [
  "monitor",
  "library",
  "inspect",
  "compose",
  "connections",
  "codeProjects",
  "setup",
] as const;

export type AppSection = (typeof APP_SECTIONS)[number];
