import type { AppSection } from "./features/simple/appSections";
import type { UserMode } from "./features/simple/UserModeContext";

export type AppV0SectionContentKind =
  | "simple-monitor"
  | "pro-monitor"
  | "simple-library"
  | "pro-library"
  | "connections"
  | "setup"
  | "fallback";

export function resolveAppV0SectionContentKind(input: {
  currentSection: AppSection;
  userMode: UserMode;
}): AppV0SectionContentKind {
  switch (input.currentSection) {
    case "monitor":
      return input.userMode === "simple" ? "simple-monitor" : "pro-monitor";
    case "library":
      return input.userMode === "simple" ? "simple-library" : "pro-library";
    case "connections":
      return "connections";
    case "setup":
      return "setup";
    default:
      return "fallback";
  }
}
