# Product Requirements Document: Modular Resume Builder

**Version:** 3.0
**Date:** 2026-07-22
**Status:** Draft
**Platform:** Web Application

---

## 1. Overview

The Modular Resume Builder is a single-page web application that lets users create, manage, and tailor resumes for different job applications. Instead of editing a single static document, users maintain a library of reusable resume "blocks" — such as experiences, skills, education, projects, and certifications — and assemble them into role-specific resume layouts using drag-and-drop.

Each block can be tagged by job type (e.g., software development, management, technical skills, design) so users can quickly surface the most relevant content when applying for a specific role. A keyword checklist panel guides users to address key terms from job descriptions. The result is a flexible, reusable resume system that reduces duplication and improves application quality.

---

## 2. Goals and Objectives

- **Reusability:** Let users write a piece of experience or a skill once and reuse it across multiple resumes.
- **Targeted Customization:** Enable fast customization of resumes for different job applications without starting from scratch.
- **Organization by Role:** Help users categorize blocks by job type so the right content is easy to find.
- **Keyword-Driven Writing:** Provide a keyword checklist so users can align their resume content with job descriptions.
- **Professional Output:** Produce clean, ATS-friendly resume documents in PDF and other export formats.
- **Ease of Use:** Provide an intuitive drag-and-drop interface that does not require design or formatting expertise.

---

## 3. Target Users

- **Job seekers** applying to multiple roles who need tailored resumes quickly.
- **Career switchers** who want to emphasize different experiences for different industries.
- **Freelancers and contractors** who maintain several role-specific profiles.
- **Professionals in technical fields** such as software engineering, product management, design, and data science.

---

## 4. Tech Stack

- **Framework:** React 18 + Vite
- **Drag-and-drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Styling:** CSS Modules
- **Rich text editing:** TipTap or Slate
- **State management:** Redux, Zustand, or Pinia
- **Persistence:** `localStorage` with backend API for multi-device sync
- **Language:** JavaScript
- **Backend:** RESTful or GraphQL API
- **Authentication:** JWT or OAuth2
- **Database:** PostgreSQL or MongoDB for structured content
- **File storage:** S3 or Cloudflare R2 for exported PDFs
- **PDF generation:** Headless browser (Puppeteer/Playwright) or a dedicated PDF service

---

## 5. Key Features

### 5.1 Resume Blocks

Resume blocks are the core content units of the application. Each block represents a discrete piece of resume content.

Supported block types include:

| Block Type | Description | Example Fields |
|------------|-------------|----------------|
| Experience | Past or current employment | Company, role, dates, location, description, achievements |
| Education | Academic background | Institution, degree, field, dates, GPA, honors |
| Skills | Technical or soft skills | Skill name, proficiency level, category |
| Projects | Personal or professional projects | Project name, URL, description, technologies |
| Certifications | Professional certifications | Name, issuer, date, expiration, credential ID |
| Summary | A short professional summary | Headline, body text |
| Awards | Honors and awards | Title, issuer, date, description |
| Publications | Articles, papers, or talks | Title, venue, date, URL |
| Volunteer Work | Volunteer experiences | Organization, role, dates, description |
| Custom Section | User-defined free-form section | Title, body |

Each block:
- Has a unique identifier and a version history.
- Supports rich text formatting (bold, italic, bullets, links).
- Can be tagged with one or more job types.
- Can be marked as "active" or "archived."

### 5.2 Keyword Checklist (Left Panel)

**Purpose:** User writes keywords from a job description they want to hit in their resume. Acts as a writing guide.

- Text input at top with "Add" button (or Enter key) to add a keyword.
- Each keyword renders as a checkbox item (unchecked by default).
- User can manually check/uncheck keywords (no auto-detection).
- Delete button (X) on each keyword to remove it.
- Counter at bottom: "X / Y keywords addressed".
- Data stored in `localStorage` under key `resume-builder-keywords`.

### 5.3 Job-Type Categorization

Users can organize blocks by job type to simplify tailoring.

- Default job types include: Software Development, Management, Technical Skills, Design, Product Management, Data Science, Marketing, Sales, Operations, and Research.
- Users can create custom job types.
- Each block can be associated with multiple job types.
- Filters in the block library let users view blocks by job type.
- Templates can suggest relevant blocks based on the selected job type.

### 5.4 Drag-and-Drop Resume Builder

The builder provides a visual canvas where users compose a resume by dragging blocks from their library into a template.

- Users can drag blocks from a sidebar into the resume canvas.
- Blocks can be reordered within a section via drag-and-drop.
- Blocks can be moved between sections (e.g., from "Additional Experience" to "Core Experience").
- Duplicate blocks can be added to a resume without duplicating the underlying source.
- Users can temporarily hide a block in a specific resume without deleting it from the library.
- Each resume stores only references to blocks, plus any resume-specific overrides (e.g., reordered bullet points, trimmed descriptions).

**Drag-and-drop behavior:**
- Drag source: experience cards in the right panel (Experience Pool).
- Drop target: the canvas area in the middle panel.
- On drag start: card lifts with slight scale (1.02) and shadow.
- On hover over drop zone: drop zone highlights with a dashed border.
- On drop: experience is added to canvas at the hovered position (or appended at bottom).
- Reordering within canvas: `@dnd-kit/sortable` handles vertical reordering.
- Removing from canvas: clicking "X" on a canvas card returns the experience to the pool (un-greys it).
- Once an experience is dragged to the canvas, it is marked as "used" (greyed out in pool, not draggable again until removed from canvas).

### 5.5 Resume Templates

Templates define the visual layout and section structure of a resume.

- A template includes predefined sections (e.g., Summary, Experience, Education, Skills).
- Templates support one-column, two-column, and hybrid layouts.
- Each template has configurable styling: font, color, spacing, and margins.
- Users can preview templates before applying them.
- Templates are responsive and optimized for PDF export.
- Premium templates may be offered in a paid tier.

### 5.6 Application-Specific Customization

Users can create multiple resumes from the same block library, each optimized for a different job application.

- Each resume can be linked to a job application record (company, role, job description).
- Users can compare versions of a resume side by side.
- Users can save application-specific notes (e.g., keywords to emphasize, required skills).
- A resume can be cloned to create a starting point for a similar application.

### 5.7 Export and Sharing

- Export resumes as PDF with consistent formatting.
- Export as plain text or Markdown for online applications.
- Generate a shareable read-only link for feedback.
- Print-friendly preview mode.
- "Export PDF" button uses `window.print()` with a print-optimized CSS stylesheet. Print styles hide left/right panels and style the middle panel for clean A4 output.
- Server-side PDF generation via headless browser (Puppeteer/Playwright) for higher-fidelity output.

### 5.8 User Authentication and Accounts

- Users can sign up and log in with email/password or SSO (Google, LinkedIn).
- Users can reset their password.
- Each user has a personal block library and resume collection.

### 5.9 Collaboration

- Shareable read-only links for feedback.
- Collaboration and feedback comments on resumes.
- Real-time collaboration support for future versions.

### 5.10 Integrations

- Single sign-on providers (Google, LinkedIn).
- LinkedIn profile import to pre-populate blocks.
- Grammar or writing assistant integration.
- Optional integration with job boards or applicant tracking systems.

---

## 6. Layout

```
+------------------+------------------------+------------------+
|   LEFT PANEL     |    MIDDLE PANEL        |   RIGHT PANEL    |
|   Keywords       |    Resume Canvas       |   Experience     |
|   Checklist      |    (drop zone)         |   Pool           |
|   ~250px         |    (flex-grow)         |   ~300px         |
+------------------+------------------------+------------------+
```

- Fixed-height viewport, no page scroll. Each panel scrolls independently.
- Responsive: on screens below 1024px, panels stack vertically with tab navigation.
- The interface uses a three-panel layout on desktop: block library on the left, resume canvas in the center, and template/properties panel on the right.
- Blocks in the library display a preview of their content and associated job type tags.
- The canvas updates in real time as blocks are added, removed, or reordered.
- Drag-and-drop interactions provide clear visual feedback (drop zones, ghost previews).
- Empty states guide users to create their first block or select a template.
- A global search bar filters blocks across all types and job categories.
- Undo/redo controls are visible in the editor toolbar.

### 6.1 Middle Panel — Resume Canvas (Detail)

- Header section at top: editable fields for Name, Email, Phone, LinkedIn (plain text inputs styled to look like a resume header).
- Below header: a vertical drop zone area labeled "Drag experiences here".
- Dropped experiences render as sortable cards in the order they were placed.
- Each card in the canvas shows: job title, company, date range, and bullet points (from the experience block).
- A small "X" button on each card removes it back to the pool.

### 6.2 Right Panel — Experience Pool (Detail)

- "Add Experience" button at top opens an inline form (not a modal — keeps flow simple).
- Form fields:
  - Job Title (text input, required)
  - Company (text input, required)
  - Start Date / End Date (month+year inputs)
  - "Current" checkbox (disables End Date)
  - Bullet Points (textarea, one bullet per line)
  - Tags (comma-separated text input for categorization, e.g., "leadership, python, aws")
- Submitted experiences appear as draggable cards below the form.
- Cards show a condensed view: title, company, date range.
- Search/filter input to filter pool by title, company, or tag.
- Edit button on each card to modify details.
- Delete button on each card to permanently remove.

---

## 7. Functional Requirements

### 7.1 Block Library

- Users can create, edit, duplicate, archive, and delete blocks.
- Users can search blocks by keyword, block type, or job type.
- Users can bulk-tag blocks with job types.
- Users can view a history of edits for each block.
- Changes to a source block propagate to all resumes using it unless the user has overridden the block locally.

### 7.2 Resume Editor

- Users can create a new resume from a template or from an existing resume.
- Users can rename, duplicate, and delete resumes.
- Users can add, remove, reorder, and hide blocks in the resume.
- Users can edit block content inline with live preview.
- Users can undo/redo editor actions.
- Auto-save captures changes every few seconds.
- Resume version comparison (side-by-side diff).

### 7.3 Template System

- The application ships with a set of default templates.
- Users can customize template colors, fonts, and spacing.
- Premium templates may be offered in a paid tier.

### 7.4 Job Application Tracking

- Users can associate a resume with a job application.
- Each application record includes company, role, job description URL, application date, and status.
- Users can view which resume was used for which application.

---

## 8. Non-Functional Requirements

- **Performance:** The editor should load within 2 seconds and remain responsive with up to 100 blocks in the library.
- **Accessibility:** The interface should meet WCAG 2.1 AA standards, including keyboard navigation for drag-and-drop operations.
- **Security:** User data should be encrypted in transit and at rest. Exported PDFs should not expose internal metadata.
- **Reliability:** Auto-save should succeed 99.9% of the time; conflicts should be surfaced clearly to the user.
- **Browser Support:** Latest versions of Chrome, Firefox, Safari, and Edge.
- **Mobile Support:** The block library and preview should be usable on tablet-sized screens; full editing is optimized for desktop.

---

## 9. User Stories and Acceptance Criteria

### US-1: Create a Block

As a user, I want to add a new experience block so that I can build my content library.

**Acceptance Criteria:**
- User can select a block type and open a creation form.
- User can fill in all relevant fields for the block type.
- User can save the block and see it in the library immediately.
- User can tag the block with one or more job types.

### US-2: Categorize Blocks by Job Type

As a user, I want to tag my blocks by job type so that I can quickly find relevant content.

**Acceptance Criteria:**
- User can assign job types to a block during creation or editing.
- User can filter the block library by job type.
- User can create custom job types.

### US-3: Build a Resume with Drag-and-Drop

As a user, I want to drag blocks from my library into a resume template so that I can customize the layout.

**Acceptance Criteria:**
- User can drag a block from the library and drop it into a section on the canvas.
- User can reorder blocks within a section.
- User can move a block between sections.
- User can remove a block from the resume without deleting it from the library.

### US-4: Tailor a Resume for a Specific Application

As a user, I want to create a copy of a resume and adjust the blocks for a specific job posting.

**Acceptance Criteria:**
- User can duplicate an existing resume.
- User can link the resume to a job application record.
- User can swap, hide, or reorder blocks to match the job description.
- User can export the tailored resume as a PDF.

### US-5: Export a Resume

As a user, I want to download my resume as a PDF so that I can submit it to employers.

**Acceptance Criteria:**
- User can preview the resume before export.
- User can export as PDF with formatting matching the chosen template.
- Exported PDF is ATS-compatible (single-column parsing, standard fonts).

### US-6: Use Keywords to Guide Resume Content

As a user, I want to maintain a keyword checklist from a job description so I can ensure my resume addresses key requirements.

**Acceptance Criteria:**
- User can add keywords via text input or Enter key.
- User can check off keywords as they are addressed in the resume.
- User can see a counter showing how many keywords have been addressed.
- User can delete keywords that are no longer relevant.

### US-7: Share a Resume for Feedback

As a user, I want to share a read-only link to my resume so that others can review and comment on it.

**Acceptance Criteria:**
- User can generate a shareable read-only link for a resume.
- Reviewers can view the resume without an account.
- Reviewers can leave feedback comments.

### US-8: Import from LinkedIn

As a user, I want to import my LinkedIn profile so that I can quickly populate my block library.

**Acceptance Criteria:**
- User can connect their LinkedIn account.
- Profile data (experiences, education, skills) is parsed into blocks.
- User can review and edit imported blocks before saving.

---

## 10. Data Model

### 10.1 Core Entities

```js
// Experience
{
  id: string (uuid),
  title: string,
  company: string,
  startDate: string,    // "YYYY-MM"
  endDate: string|null, // null = current
  bullets: string[],
  tags: string[]
}

// Keyword
{
  id: string (uuid),
  text: string,
  checked: boolean
}

// Canvas state
{
  header: { name, email, phone, linkedin },
  experienceIds: string[]  // ordered list of experience IDs
}
```

**localStorage keys:**
- `resume-builder-keywords` — keyword checklist
- `resume-builder-canvas` — canvas state (header + ordered experience IDs)
- `resume-builder-experiences` — experience pool

### 10.2 Full Data Model

#### User
- id, email, name, createdAt, updatedAt

#### Block
- id, userId, type (experience, education, skills, etc.), title, content (JSON structure based on block type), jobTypes (array of job type IDs), isArchived, createdAt, updatedAt

#### JobType
- id, userId (null for defaults), name, color (optional), createdAt

#### Resume
- id, userId, title, templateId, applicationId (optional), sections (array of section objects containing ordered block references), styleOverrides, createdAt, updatedAt

#### ResumeBlock (junction with overrides)
- id, resumeId, blockId, sectionId, orderIndex, overrides (JSON for local edits), isHidden

#### Template
- id, name, layoutType, defaultSections, defaultStyles, isPremium

#### JobApplication
- id, userId, companyName, roleTitle, jobDescriptionUrl, applicationDate, status, notes

---

## 11. File Structure

```
src/
  App.jsx                         -- Main layout, three-panel grid, state management
  App.module.css                  -- Global styles, CSS variables, layout
  main.jsx                        -- Entry point
  print.css                       -- Print-specific styles for PDF export
  components/
    BlockLibrary/
      BlockLibrary.jsx            -- Left panel: search, filter, draggable block cards
      BlockLibrary.module.css
    ResumeCanvas/
      ResumeCanvas.jsx            -- Middle panel: resume page, sections, drag-and-drop
      ResumeCanvas.module.css
      ResumeBlock.jsx             -- Individual block card rendered on the resume canvas
      ResumeBlock.module.css
    PropertiesPanel/
      PropertiesPanel.jsx         -- Right panel: template picker, personal info, tips
      PropertiesPanel.module.css
    BlockModal/
      BlockModal.jsx              -- Modal for creating/editing blocks
      BlockModal.module.css
  hooks/
    useLocalStorage.js            -- Custom hook for localStorage read/write
    useExportPdf.js               -- Custom hook wrapping window.print()
  utils/
    id.js                         -- UUID generator (crypto.randomUUID)
    constants.js                  -- Block schemas, templates, initial data, job types
index.html
package.json
vite.config.js
```

---

## 12. Technical Architecture

### 12.1 Frontend

- React 18 + Vite single-page application.
- Drag-and-drop powered by `@dnd-kit/core` + `@dnd-kit/sortable`.
- Styling via CSS Modules.
- Rich text editing using a lightweight editor (e.g., TipTap or Slate).
- State management with Redux, Zustand, or Pinia.
- Real-time collaboration support for future versions.

### 12.2 Backend

- RESTful or GraphQL API.
- Authentication via JWT or OAuth2.
- Database: PostgreSQL or MongoDB for structured content.
- File storage for exported PDFs (e.g., S3, Cloudflare R2).
- PDF generation via headless browser (Puppeteer/Playwright) or a PDF service.

### 12.3 Integrations

- Single sign-on providers (Google, LinkedIn).
- LinkedIn profile import to pre-populate blocks.
- Grammar or writing assistant integration.

---

## 13. Success Metrics

- **User Activation:** Percentage of new users who create at least three blocks within the first session.
- **Engagement:** Average number of resumes created per active user per month.
- **Retention:** Weekly active users returning to edit or export a resume.
- **Conversion:** Free-to-paid conversion rate if premium templates/features are offered.
- **Quality:** User-reported satisfaction with exported resume quality.

---

## 14. Implementation Steps

1. **Scaffold project:** `npm create vite@latest resume-builder -- --template react`, install `@dnd-kit/core`, `@dnd-kit/sortable`.
2. **Create `useLocalStorage` hook:** reusable state sync with localStorage.
3. **Build App.jsx layout:** three-panel CSS grid, full viewport height.
4. **Build KeywordPanel:** input, list, checkboxes, counter.
5. **Build ExperiencePool:** form, card list, search filter, CRUD operations.
6. **Build ResumeCanvas:** header fields, drop zone, sortable card list, PDF export button.
7. **Wire up drag-and-drop:** configure `DndContext`, drag sources in pool, drop target in canvas, sortable within canvas.
8. **Add print.css:** hide left/right panels, style middle panel for clean A4 output.
9. **Add all block types:** Education, Skills, Summary, Projects, Certifications, Awards, Publications, Volunteer Work, Custom Sections.
10. **Implement job-type categorization:** default and custom job types, filtering, template suggestions.
11. **Build template system:** multiple templates (one-column, two-column, hybrid), customizable styling, template preview.
12. **Add user authentication:** email/password, SSO (Google, LinkedIn), password reset.
13. **Set up backend:** RESTful or GraphQL API, database, file storage for PDFs.
14. **Implement job application tracking:** application records with company, role, status, notes.
15. **Add resume version comparison:** side-by-side diff view.
16. **Build sharing and collaboration:** read-only links, feedback comments.
17. **Add integrations:** LinkedIn profile import, grammar/writing assistant.
18. **Add premium templates and paid tier features.**
19. **Test end-to-end:** add experiences, drag to canvas, reorder, remove, export PDF, reload page to verify persistence, test sharing flows.

---

## 15. Open Questions

- Should the application support multi-language resumes?
- Should blocks support media attachments such as portfolio images or document links?
- What is the pricing model for premium templates and features?
- Should the application integrate with job boards or applicant tracking systems?
- How should local block overrides be visually distinguished from source blocks?

---

## 16. Appendix

### Glossary

- **Block:** A reusable unit of resume content.
- **Template:** A predefined layout and styling configuration for a resume.
- **Job Type:** A category used to organize blocks by target role or industry.
- **Application Record:** Metadata associated with a specific job application.
- **Keyword Checklist:** A list of job-description keywords used to guide resume tailoring.
- **Experience Pool:** The user's library of experience blocks available for drag-and-drop.
