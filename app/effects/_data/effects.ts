import { floatingSphereEffect } from "../floating-sphere/meta";
import { rotatingCubeEffect } from "../rotating-cube/meta";

export type EffectEntry = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export const effects: EffectEntry[] = [
  rotatingCubeEffect,
  floatingSphereEffect,
];
