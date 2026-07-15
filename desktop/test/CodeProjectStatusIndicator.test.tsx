import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CodeProjectStatusIndicator } from "../src/features/library/components/CodeProjectStatusIndicator";
import { I18nContext } from "../src/i18n/I18nContext";
import { en } from "../src/i18n/en";

afterEach(() => {
  cleanup();
});

function renderStatusIndicator(
  status: "not-configured" | "testing" | "ready" | "error",
  props?: Partial<{
    errorMessage: string;
    issueCount: number;
    lastCheckedAt: string;
  }>,
) {
  return render(
    <I18nContext.Provider value={en}>
      <CodeProjectStatusIndicator status={status} {...props} />
    </I18nContext.Provider>,
  );
}

describe("CodeProjectStatusIndicator", () => {
  it("renders 'Ready' status", () => {
    renderStatusIndicator("ready", {
      issueCount: 5,
      lastCheckedAt: "2026-07-11T10:00:00Z",
    });
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("renders 'Testing...' status with spinner", () => {
    renderStatusIndicator("testing");
    expect(screen.getByText("Testing")).toBeInTheDocument();
  });

  it("renders 'Not Configured' status", () => {
    renderStatusIndicator("not-configured");
    expect(screen.getByText("Not configured")).toBeInTheDocument();
  });

  it("shows error status", () => {
    renderStatusIndicator("error", {
      errorMessage: "Invalid credentials",
    });
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("displays issue count for ready status", () => {
    renderStatusIndicator("ready", {
      issueCount: 3,
    });
    expect(screen.getByText(/3 issues/i)).toBeInTheDocument();
  });
});
