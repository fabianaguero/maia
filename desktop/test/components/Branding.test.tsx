import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  BrandHeroLockup,
  BrandIcon,
  BrandLockup,
  BrandWordmark,
} from "../../src/components/Branding";
import { BRANDING_ASSETS } from "../../src/branding/assets";

describe("Branding", () => {
  it("renders icon, wordmark and hero assets with the shared alt text", () => {
    render(
      <div>
        <BrandIcon data-testid="brand-icon" className="icon" />
        <BrandWordmark data-testid="brand-wordmark" className="wordmark" />
        <BrandHeroLockup data-testid="brand-hero" className="hero" />
      </div>,
    );

    expect(screen.getByTestId("brand-icon")).toHaveAttribute("src", BRANDING_ASSETS.icon);
    expect(screen.getByTestId("brand-wordmark")).toHaveAttribute("src", BRANDING_ASSETS.wordmark);
    expect(screen.getByTestId("brand-hero")).toHaveAttribute("src", BRANDING_ASSETS.heroLockup);
    expect(screen.getAllByAltText("MAIA")).toHaveLength(3);
  });

  it("renders the lockup wrapper with an aria label and forwarded class names", () => {
    render(<BrandLockup className="lockup" wordmarkClassName="wordmark-class" />);

    const lockup = screen.getByLabelText("MAIA");
    expect(lockup).toHaveClass("lockup");
    expect(within(lockup).getByAltText("MAIA")).toHaveClass("wordmark-class");
  });

  it("supports switching the lockup asset variant", () => {
    render(
      <BrandLockup
        className="hero-lockup"
        wordmarkClassName="hero-image"
        variant="hero"
        ariaLabel="MAIA hero"
      />,
    );

    const lockup = screen.getByLabelText("MAIA hero");
    expect(within(lockup).getByAltText("MAIA")).toHaveAttribute("src", BRANDING_ASSETS.heroLockup);
  });
});
