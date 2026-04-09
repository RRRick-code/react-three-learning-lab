<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code, and follow deprecation notices.

<!-- END:nextjs-agent-rules -->


## Repo Rules

- This repo is a React/Next.js lab for learning three.js effects through routes.
- Use App Router routes under `app/effects/*`.
- Keep effect routes as concrete directories like `app/effects/<slug>/page.tsx`; do not introduce dynamic effect routing unless the static export flow is updated accordingly.
- Keep one effect per directory, with local scene code and metadata nearby.
- Effect-private runtime assets belong in `app/effects/<slug>/assets/**`.
- Each effect directory should keep its own `note.md`. `note.md` frontmatter is part of the build contract and should define `title`, `sourceFiles`, and `primarySource`.
- `sourceFiles` must be a whitelist of relative paths inside the same effect directory. Do not read or expose files outside that directory.
- Do not include binary runtime assets in `note.md` `sourceFiles`; that list is for source display only.
- Keep UI minimal and build it primarily from shadcn/ui components added via CLI.
- This repo targets static export and GitHub Pages compatibility. Preserve `output: "export"`, `trailingSlash: true`, and `basePath`-aware behavior unless the deployment model is intentionally changed.
- The `prepare:effects-content` step also mirrors `app/effects/<slug>/assets/**` to `public/effects/<slug>/assets/**`. Do not hand-edit generated files under `public/effects-content/*` or `public/effects/*/assets/*`; treat `scripts/generate-effect-assets.ts` as the source of truth.
- Any client-side fetch or pathname logic that touches exported asset URLs or routes must use the existing base-path helpers so the app works under GitHub Pages subpaths.
