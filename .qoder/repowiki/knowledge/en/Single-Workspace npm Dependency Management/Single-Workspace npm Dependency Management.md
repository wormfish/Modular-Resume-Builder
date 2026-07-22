---
kind: dependency_management
name: Single-Workspace npm Dependency Management
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - vite.config.js
    - .node-version
---

This repository uses a single package.json at the workspace root to manage all dependencies for both the React frontend and the Express backend. There is no monorepo tooling (no pnpm-workspace.yaml, lerna.json, or Turborepo config); instead, the project is treated as one flat npm workspace with two logical subprojects (src/ for the Vite/React SPA and server/ for the Express API).

Package manager and lockfile:
- Package manager: npm (default via npm run ... scripts).
- Lockfile: package-lock.json is committed, pinning exact transitive versions for reproducible installs.
- Node version: .node-version pins the runtime; dotenv loads server/.env for secrets.

Dependency layout:
- All runtime and dev dependencies are declared in the top-level dependencies / devDependencies sections of package.json. The server code imports from the same hoisted node_modules tree (e.g., express, mongoose, cors, dotenv).
- No vendoring strategy is used — packages are installed into the shared node_modules/ directory.

Dev-time orchestration:
- concurrently runs the Express server (npm run server) and the Vite dev server (npm run dev) in parallel via the dev:all script.
- Vite proxies /api requests to http://localhost:3001 (the Express server) so the SPA can call the backend without CORS issues during development.

Versioning policy:
- Dependencies use caret ranges (e.g., ^18.3.1, ^5.2.1, ^9.8.0), allowing minor/patch updates within the major version.
- Frontend and backend share the same dependency set rather than being split per subproject.

What is NOT present:
- No private npm registry configuration, no .npmrc overrides, no GOPRIVATE (Go-specific), no vendor/ directory, and no Go module files (go.mod/go.sum).
- No monorepo orchestrator (pnpm workspaces, Lerna, Turborepo, Nx) — the repo is intentionally a single-package setup.