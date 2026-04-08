export type EffectNotePayload = {
  slug: string;
  title: string;
  html: string;
};

export type EffectSourceFileSummary = {
  id: string;
  path: string;
  label: string;
  language: string;
};

export type EffectSourcesIndexPayload = {
  slug: string;
  primarySource: string;
  files: EffectSourceFileSummary[];
};

export type EffectSourcePayload = {
  id: string;
  path: string;
  language: string;
  html: string;
};

export type EffectFrontmatter = {
  title?: string;
  sourceFiles?: string[];
  primarySource?: string;
};
