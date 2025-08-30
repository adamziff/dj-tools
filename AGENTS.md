# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and API routes (`app/api/*/route.ts`). Shared layout in `app/layout.tsx`; global styles in `app/globals.css`.
- `components/ui/`: Reusable UI (shadcn) components.
- `lib/utils.ts`: Small helper utilities.
- `public/`: Static assets (favicons, images, fonts).
- Config: `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.eslintrc.json`. Local secrets in `.env.local` (git‑ignored).

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server with Turbopack at `http://localhost:3000`.
- `npm run build`: Create a production build.
- `npm start`: Run the production server (after build).
- `npm run lint`: Lint code using Next.js ESLint config.

Node 18+ is recommended. `pnpm` also works if preferred; mirror the commands (e.g., `pnpm dev`).

## Coding Style & Naming Conventions
- Language: TypeScript, React 18, Next.js 15 (App Router).
- Indentation: 2 spaces; aim for small, typed props/interfaces.
- Components: Export PascalCase components; files in `components/ui` are lowercased (shadcn style).
- Routes: Use Next patterns: `page.tsx`, `layout.tsx`, API `route.ts`.
- Client vs server: Add `'use client'` only where needed (state/effects, browser APIs).
- Styling: Tailwind CSS; prefer utility classes over ad‑hoc CSS.

## Testing Guidelines
- No test framework is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Suggested naming: colocate as `*.test.ts`/`*.test.tsx` or in `__tests__/` mirrors.
- Keep tests deterministic and avoid network calls; mock Spotify APIs.

## Commit & Pull Request Guidelines
- Commits: Use clear, imperative messages (e.g., `Fix auth flow redirect`). Group related changes.
- PRs: Include a concise description, screenshots/GIFs for UI changes, reproduction or test steps, and any env/setup notes.
- Link issues when applicable and call out breaking changes.

## Security & Configuration Tips
- Environment variables (set in `.env.local`): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `SPOTIFY_EMAIL_LIST`.
- Cookies: Spotify tokens are stored as httpOnly cookies by API routes—avoid exposing tokens client‑side.
- Do not commit secrets or `.env.local`. Review third‑party code before adding new deps.

