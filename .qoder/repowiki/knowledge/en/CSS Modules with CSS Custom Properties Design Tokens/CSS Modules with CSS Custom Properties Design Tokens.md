---
kind: frontend_style
name: CSS Modules with CSS Custom Properties Design Tokens
category: frontend_style
scope:
    - '**'
source_files:
    - src/App.module.css
    - src/print.css
    - src/components/BlockLibrary/BlockLibrary.module.css
    - src/components/ResumeCanvas/ResumeCanvas.module.css
    - src/components/ResumeCanvas/ResumeBlock.module.css
    - src/components/PropertiesPanel/PropertiesPanel.module.css
    - src/components/BlockModal/BlockModal.module.css
---

The frontend styling system is a lightweight, component-scoped approach built on three pillars: CSS Modules for encapsulation, CSS custom properties (variables) for theming, and a dedicated print stylesheet for PDF output. There is no external UI framework or CSS-in-JS library — the project relies entirely on plain CSS files colocated next to each React component.

**Theming via CSS custom properties**
All shared design tokens are declared in `src/App.module.css` under a single `:root` block. The token set covers palette (`--bg`, `--panel`, `--border`, `--text`, `--muted`, `--primary`, `--primary-light`, `--danger`, `--success`), spacing/shape (`--shadow`, `--radius`), and global defaults for buttons, inputs, labels, and scrollbars. Components reference these variables rather than hard-coding colors or radii, which makes it straightforward to swap themes by overriding the `:root` values.

**Component-scoped styles (CSS Modules)**
Every component directory contains a matching `.module.css` file (e.g. `BlockLibrary.module.css`, `ResumeCanvas.module.css`, `PropertiesPanel.module.css`, `BlockModal.module.css`, `ResumeBlock.module.css`). Class names are local to their module, so there is no cross-component style leakage. Naming conventions inside modules follow a simple BEM-like pattern:
- Layout containers: `.panel`, `.panelHeader`, `.panelContent`
- Interactive elements: `.tag`, `.active`, `.iconBtn`, `.addBtn`, `.small`, `.danger`
- State variants: `.dragging`, `.selected`, `.dropHint`, `.emptyState`
- Template overrides: `.template-modern`, `.template-classic` applied at the canvas root to switch resume appearance.

**Global base styles**
`App.module.css` also acts as the application base stylesheet: it resets `box-sizing`, sets the system font stack, applies the full-viewport flex layout (`app > header + body`), and defines shared button/input/label defaults that every component inherits.

**Print / PDF output**
`src/print.css` is a standalone stylesheet loaded during export. It hides all UI chrome using attribute selectors on class prefixes (`[class*='header']`, `[class*='canvasHeader']`, etc.), collapses the editor into a clean page layout, removes shadows/borders from resume sections, and sets `@page { margin: 15mm }`. This keeps the screen editor visually distinct from the printed/PDF result.

**Responsive strategy**
The app targets desktop-first editing. The canvas uses fixed A4 dimensions (`210mm × 297mm`) and the side panels have fixed widths (`320px`, `280px`). No media queries exist; responsiveness is limited to the modal's `max-width: 90vw` / `max-height: 90vh`. Print styles provide the only responsive behavior.

**What is NOT used**
No Tailwind, Sass/Less, styled-components, emotion, or CSS-in-JS. No design-token build step or theme-switcher runtime — tokens live purely in CSS variables.