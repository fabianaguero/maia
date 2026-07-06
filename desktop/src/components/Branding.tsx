import type { ImgHTMLAttributes } from "react";

import { BRANDING_ASSETS } from "../branding/assets";

type BrandingImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

type BrandingAssetKey = keyof Pick<typeof BRANDING_ASSETS, "icon" | "wordmark" | "heroLockup">;

function BrandAsset({
  assetKey,
  alt = "MAIA",
  ...props
}: BrandingImageProps & { assetKey: BrandingAssetKey; alt?: string }) {
  return <img src={BRANDING_ASSETS[assetKey]} alt={alt} {...props} />;
}

export function BrandIcon(props: BrandingImageProps) {
  return <BrandAsset assetKey="icon" {...props} />;
}

export function BrandWordmark(props: BrandingImageProps) {
  return <BrandAsset assetKey="wordmark" {...props} />;
}

export function BrandHeroLockup(props: BrandingImageProps) {
  return <BrandAsset assetKey="heroLockup" {...props} />;
}

interface BrandLockupProps {
  className?: string;
  wordmarkClassName?: string;
  variant?: "wordmark" | "hero";
  ariaLabel?: string;
}

export function BrandLockup({
  className,
  wordmarkClassName,
  variant = "wordmark",
  ariaLabel = "MAIA",
}: BrandLockupProps) {
  const Component = variant === "hero" ? BrandHeroLockup : BrandWordmark;

  return (
    <div className={className} aria-label={ariaLabel}>
      <Component className={wordmarkClassName} />
    </div>
  );
}
