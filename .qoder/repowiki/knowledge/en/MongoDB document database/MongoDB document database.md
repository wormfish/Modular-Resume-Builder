---
kind: external_dependency
name: MongoDB document database
slug: mongodb
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

Document database accessed through Mongoose ODM. Connection URI configured via `MONGODB_URI` environment variable (defaults to `mongodb://localhost:27017/resume-builder`). Two collections are modeled: blocks (reusable content templates) and resumes (user compositions referencing block IDs). Server exits with error if connection fails at startup.