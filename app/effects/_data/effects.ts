import { floatingSphereEffect } from "../floating-sphere/meta";
import { rotatingCubeEffect } from "../rotating-cube/meta";

export type EffectEntry = {
  slug: string;
  title: string;
  href: string;
};

export const effects: EffectEntry[] = [
  {
    slug: rotatingCubeEffect.slug,
    title: rotatingCubeEffect.title,
    href: rotatingCubeEffect.href,
  },
  {
    slug: floatingSphereEffect.slug,
    title: floatingSphereEffect.title,
    href: floatingSphereEffect.href,
  },
];

export const firstEffectHref = effects[0]?.href ?? null;
