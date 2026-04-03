<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code, and follow deprecation notices.

## Repo Rules

- This repo is for learning three.js under React with Next.js routes organizing demos.
- Use the App Router under `app/effects/*` for learning content.
- Keep one effect per directory, with route-local code and metadata nearby.
- Prefer `@react-three/fiber` and `@react-three/drei`; use raw three.js APIs only when there is a clear reason.
- Keep route and component structure small, explicit, and easy to extend.
- Design pages so they can later be statically exported and hosted on GitHub Pages.
- Keep shared support code in private folders like `_components` and `_data`, not in route folders.
- Keep this file short and specific to this repo.
<!-- END:nextjs-agent-rules -->
