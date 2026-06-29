import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProgressBar } from "../../src/components/ProgressBar";

afterEach(() => {
  cleanup();
});

describe("ProgressBar", () => {
  it("renders nothing when hidden", () => {
    const { container } = render(<ProgressBar visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the progress shell when visible", () => {
    const { container } = render(<ProgressBar visible={true} />);
    expect(container.querySelector(".progress-bar-container")).not.toBeNull();
    expect(container.querySelector(".progress-bar")).not.toBeNull();
  });
});
