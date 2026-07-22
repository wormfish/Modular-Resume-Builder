---
kind: build_system
name: Vite + Node.js monorepo build
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.js
---

This project uses a minimal, script-driven build system built on top of Vite (frontend) and Node.js (backend), with no Makefile, Dockerfile, or CI pipeline present.

**Frontend build**
- `vite.config.js` configures the React plugin and a dev proxy that forwards `/api` requests to `http://localhost:3001` so the SPA can call the Express server during development without CORS issues.
- `npm run build` (`vite build`) produces a static `dist/` bundle; `npm run preview` serves it locally.
- The app is an ES module (`"type": "module"` in `package.json`).

**Backend build**
- The Express server runs directly via `node --env-file=server/.env server/index.js` (`npm run server`). No transpilation step — plain `.js` files are executed as-is.
- Environment variables are loaded through Node's native `--env-file` flag plus `dotenv` for runtime access inside the server.

**Local development**
- `npm run dev:all` launches both processes concurrently using `concurrently`, running the backend on port 3001 and the Vite dev server (default 5173) simultaneously.
- `@vitejs/plugin-react` enables JSX/HMR; CSS Modules are used throughout the frontend.

**Packaging / deployment**
- There is no containerization, artifact publishing, or release automation. Deployment would consist of building the frontend (`npm run build`) and serving the resulting static files alongside the Node server process.
- Versioning is a single flat version (`1.0.0`) in the root `package.json`; there is no workspace/lerna/pnpm setup despite the repo containing both `src/` and `server/` code.