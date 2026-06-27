import type { ImgHTMLAttributes } from "react";

import { BRANDING_ASSETS } from "../branding/assets";

type BrandingImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export function BrandIcon(props: BrandingImageProps) {
  return <img src={BRANDING_ASSETS.icon} alt="MAIA" {...props} />;
}

export function BrandWordmark(props: BrandingImageProps) {
  return <img src={BRANDING_ASSETS.wordmark} alt="MAIA" {...props} />;
}

export function BrandHeroLockup(props: BrandingImageProps) {
  return <img src={BRANDING_ASSETS.heroLockup} alt="MAIA" {...props} />;
}

interface BrandLockupProps {
  className?: string;
  wordmarkClassName?: string;
}

export function BrandLockup({
  className,
  wordmarkClassName,
}: BrandLockupProps) {
  return (
    <div className={className} aria-label="MAIA">
      <BrandWordmark className={wordmarkClassName} />
    </div>
  );
}
