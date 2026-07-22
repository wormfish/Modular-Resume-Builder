---
kind: external_dependency
name: Vite build toolchain
slug: vite
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

Build and dev server for the React frontend. `npm run dev` starts the Vite dev server (default port 5173), `npm run build` produces static assets, `npm run preview` serves the built output locally. The `@vitejs/plugin-react` plugin enables JSX/HMR. The dev server proxies `/api` requests to the Node server when running both processes concurrently via `concurrently`.