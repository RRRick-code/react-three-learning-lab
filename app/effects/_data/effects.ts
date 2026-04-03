import "server-only";

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

export type EffectEntry = {
  slug: string;
  order: number;
  href: string;
};

const effectsDirectory = path.join(process.cwd(), "app/effects");
const numberedEffectPattern = /^(\d+)[-_ ]+(.*)$/;

function getEffectOrder(directoryName: string) {
  const match = directoryName.match(numberedEffectPattern);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  return Number.parseInt(match[1], 10);
}

function isEffectDirectory(directoryName: string) {
  if (directoryName.startsWith("_")) {
    return false;
  }

  return existsSync(path.join(effectsDirectory, directoryName, "page.tsx"));
}

export const effects: EffectEntry[] = readdirSync(effectsDirectory, {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter(isEffectDirectory)
  .map((directoryName) => ({
    slug: directoryName,
    order: getEffectOrder(directoryName),
    href: `/effects/${directoryName}`,
  }))
  .sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.href.localeCompare(right.href);
  });

export const firstEffectHref = effects[0]?.href ?? null;
