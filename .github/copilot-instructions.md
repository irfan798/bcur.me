# Copilot Instructions — bcur.me

A client-only playground for exploring BC-UR encoding (Uniform Resources) with multi-tab interface, animated QR codes, fountain encoding, and registry development tools.

## 🎯 Project Management

**ALWAYS start by reading these planning documents:**
1. **[PROJECT_ROADMAP.md](PROJECT_ROADMAP.md)** - High-level vision, architecture decisions, phases
2. **[FEATURES_TODO.md](FEATURES_TODO.md)** - Current sprint, task status, progress tracking
3. **Active Task File** - Check status in FEATURES_TODO.md, then read corresponding TASK-XXX file

**Workflow:**
- Before ANY code changes: Read the relevant TASK file completely
- Implementation details live in TASK files, not here
- Update FEATURES_TODO.md status after completing tasks
- Follow task sequence (don't skip blocked tasks)

## 📚 Source of Truth Hierarchy

**When implementing features, consult in this order:**

1. **Reference Project READMEs** (`reference_projects/*/README.md`)
   - `bc-ur/README.md` - Primary API documentation, usage patterns
   - `ur-registry/README.md` - Registry system, CBOR tags
   - `animated-QR-tool/README.md` - QR animation patterns
   - **These are authoritative** - if README conflicts with assumptions, README wins

2. **Reference Project Source Code** (`reference_projects/*/src/`)
   - Study actual implementations before writing new code
   - `bc-ur/src/classes/UrFountainEncoder.ts` - Multi-UR generation patterns
   - `bc-ur/src/classes/UrFountainDecoder.ts` - Multi-UR decoding patterns
   - `bc-ur/tests/` - Test cases for validation

3. **Task Files** (`.github/TASK-XXX-*.md`)
   - Detailed implementation specs for current work
   - Code templates and examples
   - Testing checklists

4. **This File** (copilot-instructions.md)
   - Core principles and patterns only
   - Cross-cutting concerns
   - Error handling standards

## Core Principles

1. **Trust the Library**  
   - Use `@ngraveio/bc-ur` library as authoritative implementation
   - Never reimplement encoding pipelines—leverage `UR.pipeline`, `BytewordEncoding`, `UrFountainEncoder`, `UrFountainDecoder`
   - **Always verify behavior against `reference_projects/bc-ur/README.md` first**
   - Study reference implementations in `reference_projects/` before writing code
   - **Development:** Use local yarn package (`@ngraveio/bc-ur@2.0.0-beta.9`)
   - **Production:** CDN import with pinned version (`https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9`)

2. **Client-First Architecture**  
   - Default: client-side processing, no backend, no analytics
   - Exception: analytics/tracking allowed when justified (document rationale)
   - Sensitive data (URs, decoded CBOR) never sent to third parties
   - Multi-tab single-page app with hash-based routing

3. **Simplicity Over Abstractions**  
   - Start with vanilla JS + semantic HTML + modular CSS
   - Only suggest frameworks/build tools when benefits outweigh costs
   - Decision framework: measure complexity cost vs concrete gains
   - **Allowed when justified:** React, Rollup, build tools (document rationale)

4. **Explicit Errors**  
   - Every failure surfaces visible, contextual UI messages (e.g., "Invalid hex (odd length)", "Incomplete multi-part UR: 40% progress")
   - Never silently ignore malformed input—show what broke and why
   - Console errors preserved for debugging (structured logging encouraged)

5. **Fast Feedback**  
   - Optimize for perceived performance (instant visual feedback)
   - Implementation details (debounce timings, cache sizes) in TASK files
   - Pipeline visualization updates with color-coded status (green success / red error / gray inactive)

6. **Reference Projects as Authority**  
   - `reference_projects/` are READ-ONLY and authoritative
   - Consult order: README → source code → tests
   - Never modify reference projects (excluded from deployments)

7. **Deterministic & Inspectable**  
   - Same input → same output (no random state)
   - State stored in inspectable objects (debuggable in DevTools)
   - Decoded CBOR with multiple views (JSON, Diagnostic, Commented, JavaScript)

## Tab Architecture (Multi-Tab SPA)

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

## Implementation Workflow

**Step-by-step for each task:**
1. Read `FEATURES_TODO.md` to identify current active task
2. Read complete TASK-XXX file for that feature
3. Consult `reference_projects/*/README.md` for API usage patterns
4. Study reference source code for implementation examples
5. Implement following task specifications
6. Test per checklist in task file
7. Update `FEATURES_TODO.md` status (🔴 TODO → 🟡 IN PROGRESS → 🟢 DONE)
8. Document any deviations or decisions in task file

## Reference Projects Usage

**Before implementing any bc-ur feature:**
1. Read `reference_projects/bc-ur/README.md` for API documentation
2. Check `reference_projects/bc-ur/src/classes/` for class implementations
3. Review `reference_projects/bc-ur/tests/` for test cases and examples
4. Study `reference_projects/animated-QR-tool/` for QR animation patterns

**Key Reference Files:**
- `UrFountainEncoder.ts` - Multi-UR generation (maxFragmentLength, minFragmentLength, repeatAfterRatio)
- `UrFountainDecoder.ts` - Multi-UR assembly with progress tracking
- `RegistryItem.ts` - Registry item factory and validation patterns
- `UR.ts` - Core UR class, pipeline methods

**Never assume library behavior—always verify against reference implementations.**

## Conversion Pipeline (Implemented)

**Canonical stages:** `multiur → ur → bytewords → hex → decoded`

**Input auto-detection priority:**
1. Multi-part UR (newlines + `ur:` or `/\d+of\d+/` pattern)
2. Single UR (`ur:` prefix)
3. Hex (even-length, `[0-9a-fA-F]+`)
4. Bytewords (4-letter words or minimal 2-char pairs)
5. Decoded JSON (manual selection only)

**Outputs:** UR | Bytewords (minimal/standard/uri) | Hex | Decoded CBOR (JSON/Diagnostic/Commented/JavaScript)

## Core Behaviors (Current Implementation)

- **Multi-part UR reassembly:** `assembleMultiUR()` uses `UrFountainDecoder`, shows progress % when incomplete
- **UR type resolution:** Auto-detects via registry (`decoded.toUr()`), falls back to manual input or `unknown-tag`
- **Bytewords style selectors:** Input/output styles independently controlled (minimal/standard/uri via `BytewordEncoding`)
- **Pipeline visualization:** Directional arrows (→ forward, ← reverse), start/end underlines, error shake animation
- **Conversion caching:** Map keyed by `[rawInput, detected, outputFormat, urTypeOverride, inputBwStyle, outputBwStyle].join('|')`
- **Copy-to-clipboard:** Success feedback (2s visual confirmation), error display on failure

## Error Messaging Standards

| Scenario | Implementation Pattern |
|----------|----------------------|
| Invalid hex | `throw new Error('Invalid hex input')` (odd length or non-hex chars) |
| Multipart incomplete | `throw new Error('Incomplete multi-part UR. Progress: ' + (progress * 100).toFixed(1) + '%')` |
| Unknown format | `updateStatus('Unable to detect input format. Please pick one.', 'error')` |
| Invalid UR type | Real-time validation in `refreshUrTypeHint()` with border color feedback |
| CBOR decode fail | `throw new Error('CBOR decode failed: ' + error.message)` |
| JSON parse fail | `throw new Error('Invalid JSON: ' + e.message)` |
| Re-encoding restriction | `throw new Error('Decoded (non-JSON view) cannot be source for re-encoding. Switch input format to Decoded JSON.')` |
| Camera permission denied | `showError(container, 'Camera access required for QR scanning. Please grant permission.')` |
| QR scan timeout | `showError(container, 'No QR code detected. Ensure good lighting and stable positioning.')` |

Messages must be concise, avoid stack traces in UI, retain specific cause.

## Current Implementation (Converter Tab)

**Conversion Pipeline:** `multiur → ur → bytewords → hex → decoded`

**Key Behaviors:**
- Multi-part UR reassembly via `UrFountainDecoder` with progress tracking
- UR type auto-detection via registry, manual override with validation `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Bytewords style selectors (minimal/standard/uri) for input and output
- Pipeline visualization with directional arrows (→ forward, ← reverse)
- Conversion caching keyed by `[rawInput, format, outputFormat, urTypeOverride, styles].join('|')`

**See TASK files for implementation details of new features.**

## Code Architecture

### Current File Structure
```
index.html          # Main shell with tab navigation
demo.js            # Tab 1: FormatConverter class
.github/           # Project planning and task tracking
  ├── copilot-instructions.md    # This file
  ├── PROJECT_ROADMAP.md         # High-level architecture & phases
  ├── FEATURES_TODO.md           # Task status tracker
  ├── TASK-001-*.md              # Deployment task
  ├── TASK-002-*.md              # Multi-tab architecture
  └── TASK-003-*.md              # Multi-UR generator
reference_projects/ # Read-only library examples (not deployed)
  ├── bc-ur/                     # Primary reference for bc-ur API
  ├── ur-registry/               # Registry patterns
  └── animated-QR-tool/          # QR animation examples
```

### Planned File Structure (Post-Refactor)
```
index.html          # Main shell with tab navigation
js/
  ├── converter.js  # Tab 1 (current demo.js)
  ├── multi-ur.js   # Tab 2 (Multi-UR generator)
  ├── scanner.js    # Tab 3 (QR scanner)
  ├── registry.js   # Tab 4 (Registry tools)
  ├── router.js     # Hash-based navigation
  └── shared.js     # Common utilities
css/
  ├── main.css      # Global styles
  └── tabs.css      # Tab-specific styles
```

### FormatConverter Class (`demo.js`)

**Key Methods:**
- `detectFormat(input)` — Pattern-based format detection (multiur → ur → hex → bytewords)
- `performConversion()` — Core orchestrator: normalize decoded-* variants, parse input to canonical artifact (UR/hex/jsValue), derive hex when needed, render output
- `assembleMultiUR(input)` — Multi-part UR decoding via `UrFountainDecoder`
- `simplePipelineViz()` — Visual pipeline update with directional arrows
- `updateUrTypeUI()` — Show/hide UR type override input with auto-detection badge
- `sanitizeUrType()` — Real-time input sanitization (lowercase, collapse hyphens, strip invalid chars)

**State Management:**
- `conversionCache` — Map caching results (120 items max, LRU-style)
- `conversionTimer` — Debounce handle for input events
- DOM refs stored in constructor (no repeated queries)

**Note:** Detailed implementation specs are in task files, not duplicated here.

### Library Integration Patterns

**Encoding/Decoding:**
```js
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

## Extension Guidelines

**Adding new formats:**
1. Update `PIPELINE_STAGES` array
2. Add detection logic in `detectFormat()` (order matters—earlier = higher priority)
3. Branch logic in `performConversion()` for parsing/rendering
4. Update `getFormatLabel()` for UI display
5. Test all combinations with existing formats

**Adding new decoded variants:**
- Extend `decodeCBOR()` with new format case
- Update output dropdown in `index.html`
- Ensure variant is read-only (cannot be source for re-encoding unless JSON)

**Prefer modifying existing helpers over parallel code paths—keep logic centralized.**

## Performance & Testing

- **Debounce timing:** 150ms typing, 10ms paste (measured in `setupEventListeners`)
- **Cache eviction:** First-in-first-out when size > 120
- **No automated tests:** Manual validation via example buttons (hex/ur/bytewords/multiur)
- **Reference data:** Use `reference_projects/bc-ur/tests/` for complex test cases

## Planned Features (Future)

- Animated QR code generation from UR (fountain-encoded parts)
- QR code scanning and decoding (camera access)
- Progress visualization for fountain decoder
- Mobile-optimized touch interactions
- Shareable permalink (URL-encoded state, privacy reviewed)

**Do NOT implement these without explicit user request—focus on current scope.**

## Non-Goals (Explicit)

- ❌ Wallet/signing functionality
- ❌ Encryption layer
- ❌ Server API calls
- ❌ Analytics/tracking
- ❌ User accounts
- ❌ Build tooling (Webpack/Vite) unless feature demands it

## Quick Start (Development)

Serve locally:
```bash
python3 -m http.server 8000
# or
npx live-server
```

Browser requirements: ES modules, Clipboard API, CSS Grid

## Security Notice

⚠️ **This demo is for development & inspection only. Not audited for handling secrets. Users are responsible for safeguarding sensitive material.**
