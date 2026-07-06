import type { AppTranslations } from "../../i18n/types";

export interface ConnectionTestViewState {
  testStatusById: Record<string, "idle" | "testing" | "success" | "error">;
  testMessageById: Record<string, string>;
}

export function buildConnectionTestPendingState(input: {
  t: AppTranslations;
  connectionId: string;
  currentStatusById: Record<string, "idle" | "testing" | "success" | "error">;
  currentMessageById: Record<string, string>;
}): ConnectionTestViewState {
  return {
    testStatusById: {
      ...input.currentStatusById,
      [input.connectionId]: "testing",
    },
    testMessageById: {
      ...input.currentMessageById,
      [input.connectionId]: input.t.simpleMode.connections.openingAdapter,
    },
  };
}

export function buildConnectionTestResolvedState(input: {
  connectionId: string;
  status: "success" | "error";
  message: string;
  currentStatusById: Record<string, "idle" | "testing" | "success" | "error">;
  currentMessageById: Record<string, string>;
}): ConnectionTestViewState {
  return {
    testStatusById: {
      ...input.currentStatusById,
      [input.connectionId]: input.status,
    },
    testMessageById: {
      ...input.currentMessageById,
      [input.connectionId]: input.message,
    },
  };
}
