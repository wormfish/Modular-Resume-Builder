---
kind: external_dependency
name: '@dnd-kit drag-and-drop library (declared, not imported)'
slug: dnd-kit
category: external_dependency
category_hints:
    - migration_status
scope:
    - '**'
---

Declared in package.json as three packages (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) but no import statements reference them anywhere in src/. Drag-and-drop is implemented with native HTML5 `draggable` + `onDragStart/onDrop` events instead. These dependencies are dead code — either remove them or migrate from the native DnD implementation to @dnd-kit.