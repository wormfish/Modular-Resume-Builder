---
kind: logging_system
name: No structured logging system — bare console statements only
category: logging_system
scope:
    - '**'
source_files:
    - server/index.js
---

This repository does not implement a dedicated logging system. There is no logging framework (e.g., Winston, Pino, Bunyan), no logger initialization or configuration file, and no middleware for request/response logging (no Morgan or similar). The entire codebase uses plain `console.log` / `console.error` calls exclusively in `server/index.js` to report MongoDB connection status and the server listen address. No structured log fields, log levels, sinks, or centralized logger abstraction exist anywhere in the server routes, models, or frontend source. The `debug` package appears only as a transitive dependency of other packages and is never imported by application code.