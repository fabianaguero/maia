import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComponentRoutingPanel } from "../../src/features/analyzer/components/ComponentRoutingPanel";

describe("ComponentRoutingPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders mock preview components when no live data has arrived yet", () => {
    render(
      <ComponentRoutingPanel
        knownComponents={[]}
        overrides={new Map()}
        onOverrideChange={vi.fn()}
        liveActive={false}
      />,
    );

    expect(screen.getByText("Component routing")).toBeInTheDocument();
    expect(screen.getByText("AuthService")).toBeInTheDocument();
    expect(screen.getByText("OrderProcessor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset all" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Gain for AuthService" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mute AuthService" })).toBeDisabled();
  });

  it("renders the waiting state when the live session is active but still empty", () => {
    render(
      <ComponentRoutingPanel
        knownComponents={[]}
        overrides={new Map()}
        onOverrideChange={vi.fn()}
        liveActive={true}
      />,
    );

    expect(screen.getByText("Waiting for live log events…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset all" })).not.toBeInTheDocument();
  });

  it("updates gain, toggles mute and resets live component overrides", () => {
    const onOverrideChange = vi.fn();
    const overrides = new Map([
      ["AuthService", { gainMult: 1.35, muted: false }],
      ["OrderProcessor", { gainMult: 0.9, muted: true }],
    ]);

    render(
      <ComponentRoutingPanel
        knownComponents={["AuthService", "OrderProcessor"]}
        overrides={overrides}
        onOverrideChange={onOverrideChange}
        liveActive={true}
      />,
    );

    fireEvent.change(screen.getByRole("slider", { name: "Gain for AuthService" }), {
      target: { value: "1.5" },
    });
    expect(onOverrideChange).toHaveBeenCalledWith("AuthService", {
      gainMult: 1.5,
      muted: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Mute AuthService" }));
    expect(onOverrideChange).toHaveBeenCalledWith("AuthService", {
      gainMult: 1.35,
      muted: true,
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset all" }));
    expect(onOverrideChange).toHaveBeenCalledWith("AuthService", {
      gainMult: 1,
      muted: false,
    });
    expect(onOverrideChange).toHaveBeenCalledWith("OrderProcessor", {
      gainMult: 1,
      muted: false,
    });

    expect(screen.getByText("135 %")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unmute OrderProcessor" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
