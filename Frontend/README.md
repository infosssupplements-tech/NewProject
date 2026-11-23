# Upolabdhi — React + Vite

This is the existing Upolabdhi React single-page application served by Vite. The original React pages, components, CSS, animations, images, and route definitions have been retained; the changes are limited to replacing the Next.js shell/build configuration with Vite.

## Run

1. Install Node.js 20.19+ (or 22.12+) and npm.
2. Copy `.env.example` to `.env` and set your existing backend URLs.
3. Run `npm install`.
4. Run `npm run dev` and open the URL Vite prints (usually http://localhost:5173).
5. Run `npm run build` to create the production bundle.

## Render deployment

The Render static-site blueprint at the repository root rewrites all routes to `/index.html`, allowing React Router routes such as `/workspace` to load on refresh. If the Render service was created manually, add a **Rewrite** rule with source `/*` and destination `/index.html`, or sync the blueprint after deploying changes. The build also emits `404.html` as a fallback for services that have not applied the rewrite yet.

## Backend note

Vite serves the frontend only. The former Next.js `/api/chat` server route is not available in a pure Vite frontend. The `/api` proxy forwards to `VITE_API_BASE_URL`, so your backend must implement the compatible chat endpoint as well as the existing API routes. Do not place private AI provider keys in browser code.
