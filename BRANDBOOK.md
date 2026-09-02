# Modular Resume Builder — Brand Book & Design System

> **Style Philosophy**: *The Pressroom & Risograph Studio*  
> An intentional blend of tactile physical print workshops and high-precision modern software. The workspace is a warm creative studio; the resume itself is a clean, timeless, distraction-free artifact.

---

## 1. Brand Concept & Core Metaphor

Modular Resume Builder is designed around the concept of a **tactile print studio (The Pressroom)**:
- **Warm Paper Surfaces**: Backgrounds use natural, unbleached studio paper tones (`#f1efe7`) rather than sterile digital grays.
- **Deep Ink Navy Chrome**: Structural frames, borders, and text are rendered in high-density ink navy (`#1d2733`) reminiscent of heavy printing press machinery and fresh ink.
- **Risograph Ink Accents**: Functional sections and actions are color-coded using curated riso-print spot inks: ultramarine blue, soft pastel rose, marker yellow, riso purple, riso teal, and press green.
- **Physical Sheet Elevation**: Hard, sharp offset shadows (`3px 3px 0 #1d2733`, `4px 4px 0 #1d2733`) give every card, panel, and button the physical weight of stacked paper stock.
- **The Quiet Artifact**: While the studio tools are expressive and tactile, the generated resume canvas remains pristine white, ensuring maximum readability, ATS compatibility, and professional print output.

---

## 2. Color System & Tokens

All colors are systematically organized in [`src/tokens.css`](file:///c:/Users/William/Documents/GitHub/Modular-Resume-Builder/src/tokens.css) as CSS custom properties.

### 2.1 Studio Surfaces & Base Inks

| Token | Value | Swatch Preview / Usage | Role |
| :--- | :--- | :--- | :--- |
| `--bg` | `#f1efe7` | Warm studio paper | Main application background |
| `--panel` | `#fdfcf7` | Crisp sheet white | Primary panel & card backgrounds |
| `--panel-2` | `#e9e6da` | Recessed craft paper | Subtle sub-panels, headers & inputs |
| `--canvas-dot` | `#c9c4b2` | Light-table dot grid | Background dot grid pattern |
| `--ink` / `--text` | `#1d2733` | Deep ink-navy | Borders, titles, heavy type & hard shadows |
| `--muted` | `#5c6470` | Slate pencil | Secondary labels, descriptions, timestamps |
| `--border` | `#cfc9ba` | Soft rule | Subtle dividers, card borders & dashed lines |

---

### 2.2 Risograph Inks & Block Type Accents

Each resume block category is assigned a distinctive riso-print spot color:

| Section Type | Primary Accent | Tint Background | Label Text | Meaning & Personality |
| :--- | :--- | :--- | :--- | :--- |
| **Summary** | `--primary`: `#274bff` *(Ultramarine)* | `--primary-light`: `#e4e9ff` | `#1a34c4` | Professional clarity, primary identity |
| **Experience** | `--pink`: `#f27999` *(Soft Pastel Rose)* | `--pink-light`: `#ffe9ef` | `#9d2053` | Dynamic career journey, human-centered work |
| **Projects** | `--purple`: `#8b5cf6` *(Riso Purple)* | `--purple-light`: `#f3e8ff` | `#6d28d9` | Creative engineering, software builds |
| **Activities** | `--teal`: `#0891b2` *(Riso Teal)* | `--teal-light`: `#e0f2fe` | `#0369a1` | Leadership, community, extracurriculars |
| **Education** | `--yellow`: `#ffd23f` *(Marker Yellow)* | `#fef08a` / `#fef9c3` | `#854d0e` | Academic background, credentials |
| **Skills** | `--green`: `#1e9e55` *(Press Green)* | `--green-light`: `#dff2e6` | `#15803d` | Verified capabilities, technical tooling |
| **Alert / Danger** | `--danger`: `#e5484d` *(Studio Crimson)* | `--danger-light`: `#fde8e8` | `#b91c1c` | Deletions, warnings, destruct actions |

---

## 3. Typography Scale & Spec Hierarchy

Three complementary typefaces establish a clear visual rhythm:

```
┌─────────────────────────────────────────────────────────────┐
│  Archivo Black       HEADLINES & LOGO                       │
│  Karla               BODY TEXT, INPUTS & RESUME CONTENT     │
│  IBM Plex Mono       LABELS, SPEC BADGES, DATES & METADATA  │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Font Families
1. **Display Font (`--font-display`)**: `'Archivo Black', sans-serif`
   - Used for main page headers, top brand logo, and bold landing page hero copy.
2. **Body Font (`--font-body`)**: `'Karla', sans-serif`
   - Highly legible grotesque sans-serif used for resume canvas body copy, form inputs, bullet points, and descriptions.
3. **Monospace Font (`--font-mono`)**: `'IBM Plex Mono', monospace`
   - Engineering/spec vibe used for section title chips, filter tabs, date ranges, drag badges, and technical labels.

---

## 4. Form Language & Tactile Components

### 4.1 Hard Offset Shadows
Instead of blurry, generic box-shadows, the interface uses solid ink-offset drops:
- **Standard Button / Card**: `box-shadow: 2px 2px 0 var(--ink)` or `3px 3px 0 var(--ink)`
- **Hover Lift**: `box-shadow: 4px 4px 0 var(--ink)` + `transform: translate(-1px, -1px)`
- **Active Press**: `box-shadow: 1px 1px 0 var(--ink)` + `transform: translate(1px, 1px)`
- **Modals & Elevated Sheets**: `box-shadow: 6px 6px 0 var(--ink)` or `7px 7px 0 var(--ink)`

### 4.2 Card Spines & Badges
- Block cards in the **Block Library** and on the **Dashboard** feature a 5px left spine colored according to their section type (`data-block-type="experience"`, `summary`, etc.).
- Compact monospace badges (`.typeChip`) in the card header provide immediate visual identification.

### 4.3 Frameless Action Icons
- Inline card actions (☰ Drag Handle, 🔗 Attach Link, ✕ Remove) are styled frameless with zero background boxes and zero shadows to keep personal info and card headers clean and uncluttered.
- Active states (e.g. attached hyperlink) highlight with spot color accents (`var(--primary)`).

### 4.4 Dashed Structural Dividers
- `1.5px dashed var(--border)` is used for subtle separation between sections (such as between **Template**, **Personal Info**, and **Tips** in the properties panel, or for unselected template toggle buttons).

---

## 5. UI Architecture & Page Breakdown

```
                  ┌──────────────────────────────┐
                  │    Modular Resume Builder    │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
    [ Landing Page ]       [ Dashboard ]        [ Resume Builder ]
    - Risograph Hero       - Resume Cards       - Left: Block Library
    - Live Demo Canvas     - Search & Filters   - Center: Canvas & Print
    - Feature Showcase     - Block Overview     - Right: Properties & AI
```

### 5.1 Landing Page (`/`)
- Risograph-inspired hero banner with bold black headlines and ink-navy call-to-actions.
- Live interactive resume mockup showcasing modular drag-and-drop mechanics.
- Feature grid highlighting AI STAR auto-parsing, tailored job targeting, and PDF export.

### 5.2 Dashboard (`/dashboard`)
- **My Resumes Grid**: Clean proof-sheet cards showing updated timestamps and section counts with direct link to the builder.
- **My Blocks Overview**:
  - **Live Search**: Instant keyword search across titles, roles, companies, descriptions, and job type tags.
  - **Section Dropdown Filter**: Quick category switching right next to the section title (*All, Summary, Experience, Projects, Activities, Education, Skills*).
  - **Color-Coded Cards**: Left spines and title chips styled per section.
  - **Text Truncation**: Automatic 3-line clamping with `"..."` for long descriptions and tooltips on hover.

### 5.3 Resume Builder (`/builder`)
- **Block Library (Left)**:
  - Multi-tag job type filtering (*Include, Require, Deselect*), search, and categorized blocks.
  - Smooth drag handles (☰) to drag blocks onto the resume canvas or delete by dropping in the library dropzone.
- **Resume Canvas (Center)**:
  - **Classic Template**: Timeless serif typography, clean horizontal rules, and traditional layout.
  - **Modern Template**: Clean sans-serif headings, subtle accent rules, and contemporary spacing.
  - Clickable print-ready PDF hyperlinks (`<a>` tags styled with exact print offsets).
- **Properties Panel (Right)**:
  - Single-row template switcher (Solid active border, dashed inactive border).
  - Dashed section dividers separating Template, Personal Info, and Tips.
  - Draggable contact info cards with custom link attachment modal.
  - **Target Job Description & AI Assistant**: Keyword extraction and ATS score matching.

---

## 6. AI Assistant & STAR Framework Guidelines

### 6.1 STAR Resume Generation Principles
When the AI Auto-Parse feature parses user experience notes into resume blocks, it follows the **STAR** method:
1. **Situation / Task (S / T)**: Defines the context, challenge, or objective faced.
2. **Action (A)**: Led by strong past-tense executive action verbs (*Spearheaded, Architected, Engineered, Optimized, Streamlined, Orchestrated, Accelerated*).
3. **Result (R)**: Always includes measurable impact with concrete metrics, percentages, dollar values, or scale figures (*"cutting latency by 45%", "scaling to 1.5M DAU", "saving $120k annually"*).

### 6.2 Tone of Voice
- **Tone**: Executive, concise, outcome-driven, ATS-optimized.
- **Format**: 2 to 4 bullet points starting with `"• "`. Zero fluff or passive filler words.

---

## 7. Motion & Accessibility

- **Reduced Motion**: All transitions and CSS animations gracefully collapse to `0.001s` when `prefers-reduced-motion: reduce` is enabled.
- **Focus Rings**: Universal high-visibility 3px blue focus indicators (`:focus-visible`) for full keyboard accessibility.
- **Color Contrast**: All text tokens meet WCAG AA contrast standards against their respective light/dark surface tokens.
