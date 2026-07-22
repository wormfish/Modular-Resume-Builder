---
kind: external_dependency
name: Express.js REST API server
slug: express
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

Node.js HTTP server providing two resource endpoints: `/api/blocks` (CRUD for reusable block definitions) and `/api/resumes` (create/delete resumes). Serves JSON with CORS enabled and a 5MB body limit. Health check at `/api/health`. Started via `npm run server` or alongside the dev server with `npm run dev:all`.