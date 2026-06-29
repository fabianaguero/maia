import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionScreenNoticeStack } from "../../src/features/session/SessionScreenNoticeStack";

describe("SessionScreenNoticeStack", () => {
  it("renders both monitor and creation notices when present", () => {
    render(<SessionScreenNoticeStack error="Tail offline" createError="Replay failed" />);

    expect(screen.getByText("Tail offline")).toBeInTheDocument();
    expect(screen.getByText("Replay failed")).toBeInTheDocument();
  });

  it("renders nothing when there are no notices", () => {
    const { container } = render(<SessionScreenNoticeStack error={null} createError={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
