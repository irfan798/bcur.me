# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BC-UR.me is a client-only playground for exploring BC-UR encoding (Uniform Resources) with multi-format conversion. Built with vanilla JavaScript, no frameworks, no backend—all processing happens in the browser for privacy.

**Live:** [bcur.me](https://bcur.me) | [irfan798.github.io/bcur.me](https://irfan798.github.io/bcur.me/)

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server (opens at http://localhost:8000)
yarn dev
# or
yarn start
```

## Speckit Workflow (CRITICAL)

**This project follows the Speckit specification-driven development methodology. ALWAYS follow these steps:**

### What is Speckit?

Speckit is GitHub's open-source toolkit for AI-powered specification-driven development. In this methodology:
- **Specifications serve as contracts** for how code should behave
- **Specifications are executable** and become the source of truth that AI agents use to generate, test, and validate code
- **Code serves specifications**, not the other way around
- The result is less guesswork, fewer surprises, and higher-quality code

### Speckit Slash Commands

This project has the following Speckit commands available:

1. **`/speckit.constitution`** - Create/update project constitution from principle inputs
2. **`/speckit.specify`** - Create/update feature specification from natural language description
3. **`/speckit.clarify`** - Identify underspecified areas and ask up to 5 targeted clarification questions
4. **`/speckit.plan`** - Execute implementation planning workflow using plan template
5. **`/speckit.tasks`** - Generate actionable, dependency-ordered tasks.md from design artifacts
6. **`/speckit.analyze`** - Perform cross-artifact consistency and quality analysis
7. **`/speckit.implement`** - Execute the implementation plan by processing all tasks in tasks.md
8. **`/speckit.checklist`** - Generate custom checklist for the current feature

### Development Workflow

**Standard workflow for new features:**

1. **Define the Feature** (if not already specified):
   ```
   /speckit.specify Add multi-UR generator with animated QR codes
   ```
   This creates a spec.md with user stories, requirements, and acceptance criteria.

2. **Clarify Ambiguities** (recommended before planning):
   ```
   /speckit.clarify
   ```
   This asks targeted questions and records answers in the spec.

3. **Create Implementation Plan**:
   ```
   /speckit.plan
   ```
   This creates plan.md with technical context, architecture decisions, and project structure.

4. **Generate Task List**:
   ```
   /speckit.tasks
   ```
   This creates tasks.md with dependency-ordered, parallelizable tasks organized by user story.

5. **Implement the Feature**:
   ```
   /speckit.implement
   ```
   This executes all tasks from tasks.md according to the plan.

6. **Analyze Quality** (optional):
   ```
   /speckit.analyze
   ```
   This checks cross-artifact consistency between spec.md, plan.md, and tasks.md.

### Working with Existing Features

**All features use Speckit workflow in `specs/` folder:**

1. **Before ANY work:** Read `.specify/memory/constitution.md` for core principles
2. **Find active feature:** Check latest folder in `specs/` (e.g., `specs/002-bc-ur-playground/`)
3. **Read complete spec:** Review `spec.md`, `plan.md`, and `tasks.md` in feature folder
4. **Consult references:** Check `reference_projects/*/README.md` for API patterns
5. **Implement:** Follow spec requirements exactly
6. **Update status:** Check off completed tasks in `tasks.md` (change `[ ]` to `[x]`)

### Source of Truth Hierarchy

When conflicts arise, this is the priority order:
1. **Reference Project READMEs** (`reference_projects/bc-ur/README.md`, etc.) - authoritative
2. **Reference Project Source Code** (`reference_projects/*/src/`) - implementation patterns
3. **Constitution** (`.specify/memory/constitution.md`) - governance principles (v1.1.0)
4. **Feature Specs** (`specs/###-feature-name/spec.md`, `plan.md`, `tasks.md`) - implementation details
5. **Copilot Instructions** (`.github/copilot-instructions.md`) - cross-cutting concerns

**Never assume library behavior—always verify against reference implementations first.**

### Speckit File Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project governance principles (v1.1.0)
├── specs/
│   └── development-setup.md     # Environment configuration spec
├── templates/
│   ├── spec-template.md         # User stories & requirements template
│   ├── plan-template.md         # Implementation plan template
│   ├── tasks-template.md        # Task list template
│   ├── checklist-template.md    # Quality checklist template
│   └── agent-file-template.md   # Agent context template
└── scripts/bash/
    ├── create-new-feature.sh    # Helper script for feature creation
    ├── setup-plan.sh            # Plan setup automation
    └── update-agent-context.sh  # Agent context updater
```

### Speckit Templates

Each template guides the creation of specific artifacts:

- **spec-template.md**: Prioritized user stories (P1/P2/P3), functional requirements (FR-XXX), acceptance scenarios (Given/When/Then), edge cases, and success criteria (SC-XXX)
- **plan-template.md**: Technical context, constitution check, project structure, complexity tracking
- **tasks-template.md**: Dependency-ordered tasks grouped by user story, with parallel execution markers `[P]` and story labels `[US1]`, organized in phases (Setup → Foundational → User Stories → Polish)
- **checklist-template.md**: Custom quality checklists with numbered items (CHK001, CHK002, etc.)

### Key Speckit Principles

1. **User Stories are Prioritized and Independent**: Each story (P1, P2, P3) must be independently testable and deliverable as an MVP increment
2. **Tasks are Grouped by User Story**: Enables parallel development and incremental delivery
3. **Foundational Phase Blocks User Stories**: Core infrastructure must complete before any user story work begins
4. **Tests Written First**: If tests are included, they must be written and fail before implementation
5. **Checkpoints Enable Validation**: Stop at any checkpoint to validate story independently

## Architecture

### Current Structure (v0.1.0)
```
index.html       # Main UI shell
demo.js          # FormatConverter class

specs/           # Speckit-generated feature specifications (OUTPUT folder)
  ├── 001-bc-ur-playground/
  │   └── spec.md                   # Initial feature specification
  └── 002-bc-ur-playground/         # Current active feature
      ├── spec.md                   # User stories, requirements, acceptance criteria
      ├── plan.md                   # Implementation plan with tech stack
      ├── tasks.md                  # Dependency-ordered task list (from /speckit.tasks)
      ├── research.md               # Phase 0 research output
      ├── data-model.md             # Data entities and relationships
      ├── quickstart.md             # Getting started guide
      ├── contracts/                # API contracts and schemas
      │   └── state-schema.md
      └── checklists/               # Quality checklists
          └── requirements.md

.specify/        # Speckit configuration (INPUT folder - templates & constitution)
  ├── memory/
  │   └── constitution.md           # Project governance principles (v1.1.0)
  ├── specs/
  │   └── development-setup.md      # Environment configuration spec
  ├── templates/                    # Speckit templates for /speckit.* commands
  │   ├── spec-template.md          # User stories & requirements
  │   ├── plan-template.md          # Implementation planning
  │   ├── tasks-template.md         # Task generation
  │   ├── checklist-template.md     # Quality checklists
  │   └── agent-file-template.md    # Agent context
  └── scripts/bash/                 # Automation helpers
      ├── create-new-feature.sh
      ├── setup-plan.sh
      └── update-agent-context.sh

.github/
  ├── copilot-instructions.md       # Development patterns & error standards
  ├── prompts/                      # Speckit slash command prompts
  └── workflows/                    # GitHub Actions (CI/CD)

reference_projects/                 # READ-ONLY library examples
  ├── bc-ur/                        # bc-ur API reference
  ├── ur-registry/                  # Registry patterns
  └── animated-QR-tool/             # QR animation examples
```

**Important Folder Distinction**:
- **`specs/`** (root) - OUTPUT folder where Speckit generates feature documentation (spec.md, plan.md, tasks.md, etc.)
  - ✅ **Committed to git** - This documentation is version controlled
  - Contains numbered feature folders: `001-feature-name/`, `002-feature-name/`, etc.
- **`.specify/specs/`** - INPUT folder for general implementation specifications (development-setup.md, etc.)
  - ✅ **Committed to git** - Templates and constitution are version controlled
- **`.specify/templates/`** - INPUT folder with templates that Speckit uses to generate files in `specs/`
  - ✅ **Committed to git** - Templates define the structure of generated docs

**Current Active Feature**: `specs/002-bc-ur-playground/` - Multi-tab BC-UR playground with QR features

### Planned Structure (Post-Refactor)
After multi-tab architecture (specs/002-bc-ur-playground):
```
js/
  ├── converter.js   # Tab 1 (current demo.js)
  ├── multi-ur.js    # Tab 2 (Multi-UR generator)
  ├── scanner.js     # Tab 3 (QR scanner)
  ├── registry.js    # Tab 4 (Registry tools)
  ├── router.js      # Hash-based navigation
  └── shared.js      # Common utilities
css/
  ├── main.css       # Global styles
  └── tabs.css       # Tab-specific styles
```

### FormatConverter Class (`demo.js`)

**Core conversion pipeline:** `multiur → ur → bytewords → hex → decoded`

**Key methods:**
- `detectFormat(input)` — Pattern-based format detection (multiur → ur → hex → bytewords priority)
- `performConversion()` — Core orchestrator: normalizes input, parses to canonical artifact (UR/hex/jsValue), renders output
- `assembleMultiUR(input)` — Multi-part UR decoding via `UrFountainDecoder` with progress tracking
- `simplePipelineViz()` — Visual pipeline update with directional arrows (→ forward, ← reverse)
- `updateUrTypeUI()` — Show/hide UR type override input with auto-detection badge
- `sanitizeUrType()` — Real-time input sanitization (lowercase, collapse hyphens, strip invalid chars)

**State:**
- `conversionCache` — Map caching results (120 items max, LRU-style, keyed by input + formats + styles)
- `conversionTimer` — Debounce handle (150ms typing, 10ms paste)
- DOM refs stored in constructor (no repeated queries)

## Core Principles (Constitution)

### 1. Trust the Library
- Use `@ngraveio/bc-ur` library as authoritative implementation
- Never reimplement encoding pipelines—leverage `UR.pipeline`, `BytewordEncoding`, `UrFountainEncoder`, `UrFountainDecoder`
- Always verify behavior against `reference_projects/bc-ur/README.md` first
- **Dev:** Local yarn package (`@ngraveio/bc-ur@2.0.0-beta.9`)
- **Prod:** CDN import with pinned version (`https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9`)

### 2. Client-First Architecture
- Default: client-side processing, no backend, no analytics
- Exception: analytics/tracking allowed when justified (document rationale in task file)
- Sensitive data (URs, decoded CBOR) never sent to third parties
- Future: Multi-tab single-page app with hash-based routing

### 3. Simplicity Over Abstractions
- Start with vanilla JS + semantic HTML + modular CSS
- Only suggest frameworks/build tools when benefits outweigh costs
- Decision framework: measure complexity cost vs concrete gains
- **Allowed when justified:** React, Rollup, build tools (document rationale)

### 4. Explicit Errors
- Every failure surfaces visible, contextual UI messages (e.g., "Invalid hex (odd length)", "Incomplete multi-part UR: 40% progress")
- Never silently ignore malformed input—show what broke and why
- Console errors preserved for debugging

### 5. Fast Feedback
- Optimize for perceived performance (instant visual feedback)
- Debounced input (150ms typing, 10ms paste)
- Pipeline visualization updates with color-coded status (green success / red error / gray inactive)

### 6. Reference Projects as Authority
- `reference_projects/` are READ-ONLY and authoritative
- Consult order: README → source code → tests
- Never modify reference projects (excluded from deployments)

### 7. Deterministic & Inspectable
- Same input → same output (no random state)
- State stored in inspectable objects (debuggable in DevTools)
- Decoded CBOR with multiple views (JSON, Diagnostic, Commented, JavaScript)

## Library Integration Patterns

```javascript
// Use UR.pipeline for CBOR ↔ hex
const hex = UR.pipeline.encode(data, { until: 'hex' });
const decoded = UR.pipeline.decode(hex, { from: 'hex' });

// Use BytewordEncoding for style variations
const encoder = new BytewordEncoding('minimal'); // or 'standard', 'uri'
const bytewords = encoder.encode(hex);
const hexFromBw = encoder.decode(bytewords);

// Use UrFountainDecoder for multipart
const decoder = new UrFountainDecoder();
lines.forEach(part => decoder.receivePartUr(part));
if (decoder.isComplete()) {
  const urString = decoder.resultUr.toString();
}

// Use UrFountainEncoder for multi-UR generation (see TASK-003)
const encoder = new UrFountainEncoder(ur, maxLen, minLen, firstSeq, repeatRatio);
const parts = encoder.getAllPartsUr(0); // 0 = pure fragments, no fountain
```

**Never manually parse UR payloads—always use `UR.fromString()`**

## Speckit Folder Structure Explained

Speckit uses two different `specs` folders with distinct purposes:

### 1. `specs/` (Root) - Generated Feature Specifications (OUTPUT)

This is where `/speckit.specify`, `/speckit.plan`, and `/speckit.tasks` create feature documentation:

**Current Features**:
- **`specs/001-bc-ur-playground/`** - Initial feature specification
- **`specs/002-bc-ur-playground/`** - Current active feature (multi-tab architecture)
  - `spec.md` - User stories (P1/P2/P3), functional requirements (FR-XXX), acceptance criteria
  - `plan.md` - Technical context, project structure, constitution compliance check
  - `tasks.md` - Dependency-ordered task list with `[P]` markers and `[US#]` labels
  - `research.md` - Phase 0 research output (library investigation)
  - `data-model.md` - Data entities and relationships
  - `quickstart.md` - Getting started guide for the feature
  - `contracts/` - API contracts and state schemas
  - `checklists/` - Custom quality checklists

**Workflow**: When you run `/speckit.specify [description]`, it creates a new folder `specs/###-feature-name/` with these files.

### 2. `.specify/specs/` (Hidden) - General Implementation Specs (INPUT)

This folder contains cross-cutting implementation specifications that apply to the entire project:

**Current Specs**:
- **development-setup.md**: Defines development vs production environment configurations
  - Environment separation (dev: local packages, prod: CDN imports)
  - Import strategies (import maps, conditional imports, build script swap)
  - Local development server (ALWAYS use `yarn dev`, never Python/npx http-server)
  - Dependency management (version pinning, ESM requirements)
  - Build tools decision framework (when to add Rollup)
  - Browser testing requirements (Chrome 90+, Firefox 88+, Safari 14+)
  - HTTPS setup for camera API (mkcert, ngrok, Caddy)
  - Analytics/monitoring guidelines (only when justified)

**Creating New General Specs**:

When you need to add implementation details that apply across all features and don't fit in the constitution:

1. Create a new `.md` file in `.specify/specs/` with a descriptive name
2. Document concrete implementation patterns, timings, configurations
3. Reference from task files or copilot-instructions.md
4. Keep specs focused on "how" and "what", not "why" (that's the constitution)

**Philosophy**: Constitution = "Why & When", `.specify/specs/` = "How & What" (general), `specs/` = Feature-specific documentation

## Common Workflows

### Adding a New Feature

**Recommended: Speckit Workflow (for new features)**
1. Run `/speckit.specify [feature description]`
   - Creates `specs/###-feature-name/spec.md` with user stories and requirements
2. Run `/speckit.clarify` to resolve ambiguities (optional but recommended)
   - Updates spec.md with clarification answers
3. Run `/speckit.plan` to create implementation plan
   - Creates `specs/###-feature-name/plan.md`, `research.md`, `data-model.md`, `contracts/`, etc.
4. Run `/speckit.tasks` to generate dependency-ordered task list
   - Creates `specs/###-feature-name/tasks.md` with `[P]` markers and `[US#]` labels
5. Run `/speckit.implement` to execute all tasks
   - Reads from `specs/###-feature-name/tasks.md` and executes sequentially
6. Consult `reference_projects/bc-ur/README.md` for bc-ur API patterns as needed
7. Run `/speckit.analyze` to verify cross-artifact consistency (optional)
   - Analyzes spec.md, plan.md, and tasks.md for consistency

**Finding the Current Active Feature**:
- Check the most recent folder in `specs/` (e.g., `002-bc-ur-playground/`)
- Read `specs/###-feature-name/tasks.md` to see all tasks
- Check task checkboxes `[ ]` vs `[x]` to see progress
- Current active: `specs/002-bc-ur-playground/` - Multi-tab architecture with QR features

### Modifying Conversion Pipeline
1. Update `PIPELINE_STAGES` array in `demo.js`
2. Add detection logic in `detectFormat()` (order matters—earlier = higher priority)
3. Branch logic in `performConversion()` for parsing/rendering
4. Update `getFormatLabel()` for UI display
5. Test all combinations with existing formats

### Adding New Dependencies
1. **Evaluate need:** Can vanilla JS solve this?
2. **Check bundle size:** Use bundlephobia.com
3. **Verify ESM support:** Must work as ES module
4. **Document rationale:** Update spec/plan.md with why it's needed
5. **Pin versions:** Use exact versions in package.json and CDN imports

## Error Messaging Standards

All errors must be concise, contextual, and actionable:

- Invalid hex: `"Invalid hex input"` (odd length or non-hex chars)
- Multipart incomplete: `"Incomplete multi-part UR. Progress: X%"`
- Unknown format: `"Unable to detect input format. Please pick one."`
- Invalid UR type: Real-time validation in `refreshUrTypeHint()` with border color
- CBOR decode fail: `"CBOR decode failed: " + error.message`
- Re-encoding restriction: `"Decoded (non-JSON view) cannot be source for re-encoding. Switch input format to Decoded JSON."`

Messages must be concise, avoid stack traces in UI, retain specific cause.

## Tab Architecture (specs/002-bc-ur-playground)

**Navigation:** Hash-based routing (`#converter`, `#multi-ur`, `#scanner`, `#registry`)

**Data Flow:**
1. **Converter Tab** → outputs single UR → forwards to Multi-UR Generator
2. **Multi-UR Generator** → creates fountain-encoded parts → displays animated QR
3. **QR Scanner** → decodes multi-part UR → forwards back to Converter
4. **Registry Tools** → developer playground for CBOR registry items

**State Management:**
- Cross-tab data via URL params and sessionStorage (temporary only)
- Auto-clear sessionStorage on page unload
- No persistent data retention

## Testing

No automated tests—manual validation via example buttons in UI.

**Browser Requirements:**
- Chrome 90+ (desktop & mobile)
- Firefox 88+ (desktop & mobile)
- Safari 14+ (iOS & macOS)
- Requires: ES modules, Clipboard API, CSS Grid

**Reference Data:** Use `reference_projects/bc-ur/tests/` for complex test cases

## Important Reference Files

Before implementing bc-ur features, consult these:

- `reference_projects/bc-ur/README.md` - Primary API documentation
- `reference_projects/bc-ur/src/classes/UrFountainEncoder.ts` - Multi-UR generation
- `reference_projects/bc-ur/src/classes/UrFountainDecoder.ts` - Multi-UR assembly
- `reference_projects/bc-ur/src/classes/RegistryItem.ts` - Registry patterns
- `reference_projects/bc-ur/src/classes/UR.ts` - Core UR class, pipeline methods
- `reference_projects/animated-QR-tool/README.md` - QR animation patterns

## What NOT to Do

- ❌ Modify `reference_projects/` (they're read-only examples)
- ❌ Skip the Speckit workflow for new features (use `/speckit.specify` → `/speckit.plan` → `/speckit.tasks`)
- ❌ Violate the constitution without documenting justification in the complexity tracking table
- ❌ Add wallet/signing functionality
- ❌ Add encryption layer
- ❌ Make server API calls (unless justified in spec/task file)
- ❌ Add analytics/tracking (unless justified in spec/task file)
- ❌ Skip reading the TASK file before implementing existing features
- ❌ Assume library behavior without checking reference docs
- ❌ Implement features without updating task status
- ❌ Use build tooling (Webpack/Vite) unless feature demands it and documented in plan

## Quick Reference: Speckit Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/speckit.constitution` | Create/update project principles | Initial setup or principle changes |
| `/speckit.specify` | Define feature requirements | Starting a new feature |
| `/speckit.clarify` | Ask clarification questions | Before planning, when spec is unclear |
| `/speckit.plan` | Create implementation plan | After spec is clear |
| `/speckit.tasks` | Generate task list | After plan is complete |
| `/speckit.implement` | Execute all tasks | Ready to build the feature |
| `/speckit.analyze` | Check consistency | Quality assurance after task generation |
| `/speckit.checklist` | Generate custom checklist | Need specific quality/testing checklist |

## Security Notice

⚠️ **This demo is for development & inspection only. Not audited for handling secrets. Users are responsible for safeguarding sensitive material.**
