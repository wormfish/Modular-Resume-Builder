---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Block
- Definition：A reusable piece of resume content (e.g., summary, work experience, education) defined once in the Block Library and then instantiated multiple times within a resume's sections. Each block has a type, jobTypes tags, and typed content fields. Blocks are shared across resumes — deleting a block removes it from every resume that references it.
- Aliases：block、content block

### Resume Canvas
- Definition：The central editing panel where a user composes a resume by arranging blocks into ordered sections. Supports dragging blocks between sections and reordering within sections. A resume is a collection of sections, each with a title and an ordered list of block IDs.
- Aliases：canvas、resume editor

### Block Library
- Definition：The left panel containing all available block definitions, searchable by content and filterable by job type tags. Users create/edit/delete blocks here and drag them onto the canvas to instantiate them in a resume.
- Aliases：library、block palette

### Properties Panel
- Definition：The right panel for configuring resume-level settings: selecting a template, editing personal info (name, contact), and viewing tips. Separate from block-level editing which happens in the Block Modal.
- Aliases：properties、settings panel

### Job Type
- Definition：A tag/category (e.g., 'Software Engineer', 'Designer') that can be attached to blocks for filtering in the Block Library. Users can add custom job types; blocks can have multiple job types and resumes can be filtered by selected job type.
- Aliases：jobtype、job tag

### Template
- Definition：A predefined resume layout configuration identified by a templateId, selectable in the Properties Panel. Templates determine the visual presentation of sections and blocks on the canvas.
- Aliases：templateId、resume template

### Section
- Definition：A named, ordered grouping of blocks within a resume (e.g., 'Work Experience', 'Education'). Sections can be added, removed, and renamed; blocks are inserted into sections in a specific order.
- Aliases：resume section

### Personal Info
- Definition：Resume header metadata including name and contact details, edited in the Properties Panel and rendered at the top of the resume preview.
- Aliases：personal information、contact info

### JSON Export/Import
- Definition：File-based backup and restore mechanism. Export downloads a .json file containing blocks, resume, personalInfo, and jobTypes; Import validates the structure, prompts for confirmation, then replaces all current state. Also supports granular export/import of just blocks or just the resume.
- Aliases：export json、import json、backup、restore

### PDF Export
- Definition：Print-to-PDF feature using the browser's window.print() with dedicated print styles (print.css) to produce a clean PDF of the current resume without UI chrome.
- Aliases：export pdf、print resume

### Offline / Online Mode
- Definition：Runtime indicator showing whether the app is connected to the backend server. When offline, changes persist only in localStorage; when online, block CRUD operations sync to the server. Controlled by the useApiSync hook's health-check polling.
- Aliases：sync status、connection indicator
