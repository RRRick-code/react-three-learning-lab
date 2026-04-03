<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code, and follow deprecation notices.

## Repo Rules

- This repo is a React/Next.js lab for learning three.js effects through routes.
- Use App Router routes under `app/effects/*`.
- Keep one effect per directory, with local scene code and metadata nearby.
- Prefer `@react-three/fiber` and `@react-three/drei`; avoid raw three.js bootstrapping unless necessary.
- Keep UI minimal and build it primarily from shadcn/ui components added via CLI.
- Do not default to black-background / white-text dark mode styling.
- Keep the left navigation fixed, minimal, and title-only; no site chrome or extra copy.
- Let the effect canvas/content dominate the layout; keep surrounding frame text to a minimum.
- Keep the structure friendly to future static export and GitHub Pages deployment.
- Keep this file short and repo-specific.
<!-- END:nextjs-agent-rules -->
