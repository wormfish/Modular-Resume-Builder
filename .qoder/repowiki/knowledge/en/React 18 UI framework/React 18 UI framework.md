---
kind: external_dependency
name: React 18 UI framework
slug: react
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

Frontend framework powering all components under src/. Entry point is src/main.jsx; state is managed via React hooks and custom hooks (useApiSync, useLocalStorage, useJsonExportImport). Components are organized into feature folders (BlockLibrary, ResumeCanvas, PropertiesPanel, BlockModal) each with scoped CSS modules.