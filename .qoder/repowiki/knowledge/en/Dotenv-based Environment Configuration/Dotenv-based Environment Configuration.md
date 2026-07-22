---
kind: configuration_system
name: Dotenv-based Environment Configuration
category: configuration_system
scope:
    - '**'
source_files:
    - server/.env
    - server/.env.example
    - server/index.js
    - package.json
    - vite.config.js
---

This repository uses a minimal, file-driven configuration approach centered on `.env` files and Node.js `dotenv`, with no centralized config module or schema validation.

**What system/approach is used**
- Server-side: `dotenv` loads `server/.env` into `process.env`; the server entry point calls `dotenv.config()` at startup and reads values directly from `process.env`.
- Frontend dev proxy: Vite's `vite.config.js` hardcodes the backend target (`http://localhost:3001`) for `/api` proxying during development — there is no runtime-configurable frontend base URL.
- Runtime launch: The `npm run server` script uses Node's built-in `--env-file=server/.env` flag (Node 20+) to load env vars before bootstrapping Express.

**Key files and packages**
- `server/.env` — live environment variables (MongoDB URI, port).
- `server/.env.example` — template shared with collaborators; mirrors the live file.
- `server/index.js` — calls `dotenv.config()`, reads `PORT` and `MONGODB_URI` from `process.env`, applies defaults.
- `package.json` scripts — `"server": "node --env-file=server/.env server/index.js"` and `"dev:all": "concurrently \"npm run server\" \"npm run dev\""`.
- `vite.config.js` — development-only proxy target for `/api` → `http://localhost:3001`.

**Architecture and conventions**
- All configuration lives in flat `.env` files under `server/`; there is no layered config (no per-environment variants like `.env.production`).
- Values are consumed inline via `process.env.X || default` rather than through a typed config object or schema validator.
- No feature flags, secrets rotation, or external secret store integration — MongoDB credentials and server port are the only runtime knobs.
- The frontend has no equivalent runtime configuration mechanism; its API base URL is baked into the Vite dev proxy and would require a build-time constant change for production.

**Rules developers should follow**
- Add new server settings as uppercase `KEY=value` pairs in both `server/.env` and `server/.env.example`.
- Always provide a sensible default via `process.env.KEY || fallback` in `server/index.js` (or route/model files) so the app can start without every variable set.
- Never commit real secrets — keep `server/.env` in `.gitignore` (already present) and share only `server/.env.example`.
- When changing the backend port, update both `server/.env` and the Vite proxy target in `vite.config.js` to keep local dev working.