import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Web3Spinner } from "../../src/components/Web3Spinner";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
});

function renderSpinner(props: React.ComponentProps<typeof Web3Spinner>) {
  return render(
    <I18nContext.Provider value={en}>
      <Web3Spinner {...props} />
    </I18nContext.Provider>,
  );
}

describe("Web3Spinner", () => {
  it("renders nothing when not visible", () => {
    const { container } = renderSpinner({ visible: false });
    expect(container.firstChild).toBeNull();
  });

  it("renders the default translated label and spinner layers", () => {
    const { container } = renderSpinner({ visible: true });

    expect(screen.getByText(en.simpleMode.common.analyzingDna)).toBeInTheDocument();
    expect(container.querySelector(".orbit-halo")).not.toBeNull();
    expect(container.querySelector(".orbit-inner")).not.toBeNull();
    expect(container.querySelector(".orbit-core")).not.toBeNull();
  });

  it("renders a custom label when provided", () => {
    renderSpinner({ visible: true, label: "Ingesting telemetry source..." });
    expect(screen.getByText("Ingesting telemetry source...")).toBeInTheDocument();
  });
});
