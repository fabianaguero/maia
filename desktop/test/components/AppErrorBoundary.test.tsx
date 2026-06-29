import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "../../src/components/AppErrorBoundary";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderBoundary(children: React.ReactNode) {
  return render(
    <I18nContext.Provider value={en}>
      <AppErrorBoundary>{children}</AppErrorBoundary>
    </I18nContext.Provider>,
  );
}

describe("AppErrorBoundary", () => {
  it("renders children when no render error occurs", () => {
    renderBoundary(<div>healthy-ui</div>);

    expect(screen.getByText("healthy-ui")).toBeInTheDocument();
    expect(screen.queryByText(en.simpleMode.runtime.uiRuntimeError)).not.toBeInTheDocument();
  });

  it("renders the runtime fallback with stack details when a child throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    function Thrower() {
      throw new Error("boom while rendering");
    }

    renderBoundary(<Thrower />);

    expect(screen.getByText(en.simpleMode.runtime.desktopRuntime)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.runtime.uiRuntimeError)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.runtime.crashedWhileRendering)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.runtime.blackScreenReplacement)).toBeInTheDocument();
    expect(screen.getByText(/boom while rendering/i)).toBeInTheDocument();
    const throwerMentions = screen.getAllByText(/Thrower/);
    expect(throwerMentions).toHaveLength(2);
    expect(errorSpy).toHaveBeenCalled();
  });
});
