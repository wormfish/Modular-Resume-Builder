---
kind: error_handling
name: Ad-hoc try/catch with flat JSON error responses
category: error_handling
scope:
    - '**'
source_files:
    - server/index.js
    - server/routes/blocks.js
    - server/routes/resumes.js
    - src/api/client.js
---

This repository uses a minimal, ad-hoc error-handling approach with no centralized error framework or custom error types.

**Server (Express)**
- `server/index.js` handles the only unhandled promise rejection — MongoDB connection failure is caught and logged via `console.error`, then the process exits with code 1. There is no global Express error middleware (`app.use((err, req, res, next) => ...)`).
- Every route handler in `server/routes/blocks.js` and `server/routes/resumes.js` wraps its async body in a local `try/catch`. Errors are turned into HTTP responses by calling `res.status(…).json({ error: err.message })`. Validation-style failures (e.g. resource not found) return 404 with a plain string message; Mongoose/validation errors return 400; unexpected failures return 500. There is no consistent mapping between error classes and status codes.
- No custom error class exists, no sentinel errors, and no structured error envelope beyond `{ error: <string> }`.

**Frontend (React + fetch)**
- `src/api/client.js` centralizes all HTTP calls through a single `request(path, options)` helper. If `res.ok` is false it reads the response body (safely falling back to `{}`), then throws a generic `Error(body.error || 'Request failed: …')`. Successful responses are returned as parsed JSON.
- Callers of these helpers are expected to handle the thrown `Error`; there is no global fetch interceptor or React-level error boundary shown in the scanned files.

**Conventions observed**
- Server-side: per-route `try/catch` → `res.status(code).json({ error: message })`.
- Client-side: one `request()` wrapper that converts non-2xx responses into thrown `Error`s using the server's `{ error }` payload.
- No shared error constants, no HTTP-status-to-error-type mapping, no logging library, no panic/recover equivalent.