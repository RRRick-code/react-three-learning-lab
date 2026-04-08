import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { codeToHtml } from "shiki";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type {
  EffectFrontmatter,
  EffectNotePayload,
  EffectSourcePayload,
  EffectSourcesIndexPayload,
} from "../lib/effect-content";

const repoRoot = process.cwd();
const effectsDirectory = path.join(repoRoot, "app/effects");
const outputDirectory = path.join(repoRoot, "public/effects-content");

function isEffectDirectory(directoryName: string) {
  if (directoryName.startsWith("_")) {
    return false;
  }

  return existsSync(path.join(effectsDirectory, directoryName, "page.tsx"));
}

function getLanguage(relativePath: string) {
  const extension = path.extname(relativePath).toLowerCase();

  switch (extension) {
    case ".ts":
      return "ts";
    case ".tsx":
      return "tsx";
    case ".js":
      return "js";
    case ".jsx":
      return "jsx";
    case ".json":
      return "json";
    case ".css":
      return "css";
    case ".frag":
    case ".vert":
    case ".glsl":
      return "glsl";
    case ".md":
      return "md";
    default:
      return "txt";
  }
}

function ensureInsideEffectDirectory(effectDirectory: string, relativePath: string) {
  const absolutePath = path.resolve(effectDirectory, relativePath);

  if (!absolutePath.startsWith(`${effectDirectory}${path.sep}`) && absolutePath !== effectDirectory) {
    throw new Error(`Source file "${relativePath}" escapes effect directory "${effectDirectory}"`);
  }

  if (!existsSync(absolutePath)) {
    throw new Error(`Source file "${relativePath}" does not exist in "${effectDirectory}"`);
  }

  return absolutePath;
}

function getSourceId(relativePath: string) {
  const digest = createHash("sha1").update(relativePath).digest("hex").slice(0, 8);
  const baseName = path.basename(relativePath, path.extname(relativePath)).replace(/[^a-zA-Z0-9]+/g, "-");

  return `${baseName || "source"}-${digest}`;
}

async function renderMarkdown(markdown: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

async function renderSource(code: string, language: string) {
  return codeToHtml(code, {
    lang: language,
    theme: "github-light",
    transformers: [],
  });
}

function normalizeFrontmatter(slug: string, effectDirectory: string) {
  const notePath = path.join(effectDirectory, "note.md");

  if (!existsSync(notePath)) {
    throw new Error(`Missing note.md for effect "${slug}"`);
  }

  const { data, content } = matter(readFileSync(notePath, "utf8"));
  const frontmatter = data as EffectFrontmatter;
  const title = frontmatter.title?.trim() || slug;
  const sourceFiles = frontmatter.sourceFiles?.length ? frontmatter.sourceFiles : ["page.tsx"];
  const primarySource = frontmatter.primarySource || sourceFiles[0];

  if (!sourceFiles.includes(primarySource)) {
    throw new Error(`primarySource "${primarySource}" must be included in sourceFiles for "${slug}"`);
  }

  return {
    title,
    content,
    sourceFiles,
    primarySource,
  };
}

async function buildEffectAssets(slug: string) {
  const effectDirectory = path.join(effectsDirectory, slug);
  const outputRoot = path.join(outputDirectory, slug);
  const outputSourcesDirectory = path.join(outputRoot, "sources");
  const { title, content, sourceFiles, primarySource } = normalizeFrontmatter(slug, effectDirectory);

  mkdirSync(outputSourcesDirectory, { recursive: true });

  const notePayload: EffectNotePayload = {
    slug,
    title,
    html: await renderMarkdown(content),
  };

  writeFileSync(path.join(outputRoot, "note.json"), JSON.stringify(notePayload, null, 2));

  const sourceSummaries: EffectSourcesIndexPayload["files"] = [];

  for (const relativePath of sourceFiles) {
    const absolutePath = ensureInsideEffectDirectory(effectDirectory, relativePath);
    const language = getLanguage(relativePath);
    const id = getSourceId(relativePath);
    const code = readFileSync(absolutePath, "utf8");
    const sourcePayload: EffectSourcePayload = {
      id,
      path: relativePath,
      language,
      html: await renderSource(code, language),
    };

    sourceSummaries.push({
      id,
      path: relativePath,
      label: path.basename(relativePath),
      language,
    });

    writeFileSync(
      path.join(outputSourcesDirectory, `${id}.json`),
      JSON.stringify(sourcePayload, null, 2)
    );
  }

  const indexPayload: EffectSourcesIndexPayload = {
    slug,
    primarySource,
    files: sourceSummaries,
  };

  writeFileSync(
    path.join(outputSourcesDirectory, "index.json"),
    JSON.stringify(indexPayload, null, 2)
  );
}

async function main() {
  const effectSlugs = readdirSync(effectsDirectory, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter(isEffectDirectory);

  rmSync(outputDirectory, { recursive: true, force: true });
  mkdirSync(outputDirectory, { recursive: true });

  for (const slug of effectSlugs) {
    await buildEffectAssets(slug);
  }

  console.log(`Generated effect assets for ${effectSlugs.length} effect(s).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
