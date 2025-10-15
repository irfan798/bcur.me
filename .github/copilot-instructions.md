# Copilot Instructions — bcur.me

A client-only playground for exploring BC-UR encoding (Uniform Resources) with multi-tab interface, animated QR codes, fountain encoding, and registry development tools.

## 🎯 Project Management

**This project uses Speckit specification-driven development:**

**ALWAYS start by reading these planning documents:**
1. **Active Feature Folder** (`specs/002-bc-ur-playground/`) - Current feature specification
2. **[spec.md](../specs/002-bc-ur-playground/spec.md)** - User stories, requirements, acceptance criteria
3. **[tasks.md](../specs/002-bc-ur-playground/tasks.md)** - 66 implementation tasks organized by user story
4. **[plan.md](../specs/002-bc-ur-playground/plan.md)** - Technical context, architecture decisions

**Workflow:**
- Before ANY code changes: Read the relevant section in spec.md and tasks.md
- Implementation details live in tasks.md and plan.md, not here
- Update tasks.md checkboxes `[ ]` → `[x]` after completing tasks
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

3. **Speckit Feature Files** (`specs/002-bc-ur-playground/`)
   - **spec.md** - User stories, functional requirements, acceptance criteria
   - **tasks.md** - Detailed implementation tasks with code templates
   - **plan.md** - Technical context and architecture decisions
   - **data-model.md** - Entity relationships and validation rules

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
1. Read `specs/002-bc-ur-playground/tasks.md` to identify current active task
2. Read complete task description and acceptance criteria
3. Consult `reference_projects/*/README.md` for API usage patterns
4. Study reference source code for implementation examples
5. Implement following task specifications
6. Test per checklist in task file
7. Update `tasks.md` checkbox: `[ ]` → `[x]` when complete
8. Document any deviations or decisions in task file comments

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

### Tab 1: Format Converter
- **Multi-part UR reassembly:** `assembleMultiUR()` uses `UrFountainDecoder`, shows progress % when incomplete
- **UR type resolution:** Auto-detects via registry (`decoded.toUr()`), falls back to manual input or `unknown-tag`
- **Bytewords style selectors:** Input/output styles independently controlled (minimal/standard/uri via `BytewordEncoding`)
- **Pipeline visualization:** Directional arrows (→ forward, ← reverse), start/end underlines, error shake animation
- **Conversion caching:** Map keyed by `[rawInput, detected, outputFormat, urTypeOverride, inputBwStyle, outputBwStyle].join('|')`
- **Copy-to-clipboard:** Success feedback (2s visual confirmation), error display on failure
- **Registry item decoding:** Automatic typed class instantiation (CryptoSeed, DetailedAccount, etc.)
- **Property inspector:** DevTools-style tree view with executable methods (no-param methods run inline, param methods show console hints)
- **Type drawer:** Expandable CDDL schema viewer (collapsed by default, shows tag/URType/package/docs)
- **Console exposure:** `window.$lastRegistryItem`, `window.$cbor` utilities, all bc-ur classes and registry types

### Tab 2: Multi-UR Generator
- **Fountain encoding:** `UrFountainEncoder` with configurable params (maxFragmentLength, minFragmentLength, repeatAfterRatio)
- **Animated QR:** Canvas-based with requestAnimationFrame, 1-30fps configurable
- **Infinite looping:** repeatAfterRatio=0 disables part list, shows streaming preview
- **Encoder blocks grid:** Visual representation of which blocks each fragment contains
- **Copy options:** Individual part, all parts text, current QR as PNG

### Tab 3: QR Scanner
- **Camera integration:** MediaDevices API with permission handling
- **Real-time scanning:** qr-scanner@1.4.2 with Web Worker
- **Fountain decoder:** Progress visualization with decoded blocks grid (green/gray)
- **Auto-forward:** Navigates to converter when 100% complete
- **Error handling:** 10s timeout, permission revocation detection, camera fallback messages

### Tab 4: Registry Browser
- **Type enumeration:** All 6 ur-registry packages dynamically loaded
- **Package grouping:** Collapsible sections by package origin
- **CDDL viewer:** CSS-based syntax highlighting (keywords blue, types green, comments gray)
- **Documentation links:** Auto-populated when available from package metadata

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
| No camera available | `showError(container, 'No camera detected. Please use mobile device or paste UR manually.')` |
| Camera permission revoked | `showError(container, 'Camera permission was revoked. Please re-grant permission in browser settings.')` |
| Multi-UR param validation | `throw new Error('Invalid encoder parameters: minFragmentLength must be less than maxFragmentLength')` |
| UR type mismatch (scanner) | `showWarning(container, 'UR type mismatch detected: expected crypto-seed but received crypto-psbt')` |
| Method execution error | `console.error(error); showConsoleHint('Method requires parameters. Try: window.$lastRegistryItem.method(...)')` |

Messages must be concise, avoid stack traces in UI, retain specific cause.

## Current Implementation Status (Updated 2025-10-15)

### ✅ Phase 1-4: Core Features Complete

**Implemented & Deployed:**

**Tab 1 - Format Converter (US1 - Priority P1)** ✅ 100% Complete
- Multi-format conversion (UR ↔ Bytewords ↔ Hex ↔ CBOR)
- Multi-part UR assembly with fountain decoder
- Format auto-detection with pipeline visualization
- UR type detection and manual override
- Registry item decoding with typed classes (CryptoSeed, DetailedAccount, etc.)
- **Property Inspector** (540 lines in registry-item-ui.js):
  - DevTools-style expandable tree view with ▶/▼ icons
  - Inline method execution for no-param methods
  - Console hints for parameterized methods
  - Recursive inspector (method results render as nested trees)
  - Try-catch execution for optional parameter detection
  - Copy-to-clipboard: JSON, Hex, UR, Registry Item Code
- **Type Drawer**: Expandable CDDL schema viewer (collapsed by default)
- **Console Exposure**:
  - `window.UR`, `window.BytewordEncoding`, `window.UrFountainEncoder`, `window.UrFountainDecoder`
  - All registry classes: `window.CryptoHDKey`, `window.CryptoSeed`, `window.DetailedAccount`, etc.
  - `window.$lastDecoded`, `window.$lastRegistryItem`
  - `window.$cbor` utilities (inspect, diff, export, findType, listTags)

**Tab 2 - Multi-UR Generator (US2 - Priority P2)** ✅ 93% Complete
- Multi-part UR generation with fountain encoder
- Animated QR code display (5fps default, configurable 1-30fps)
- Encoder parameter controls (maxFragmentLength, minFragmentLength, repeatAfterRatio)
- Infinite looping mode (repeatAfterRatio=0)
- Encoder blocks grid visualization
- Copy-to-clipboard: individual part, all parts, QR as PNG
- ⏳ **Remaining**: T051 - Animated GIF export (planned)

**Tab 3 - QR Scanner (US3 - Priority P1)** ✅ 100% Complete
- Camera access with permission handling
- Real-time QR scanning (qr-scanner@1.4.2)
- Fountain decoder with progress visualization
- Decoded blocks grid (green=decoded, gray=pending)
- Progress tracking (percentage, blocks count)
- UR type mismatch detection
- Auto-forward to converter on 100% completion
- Copy assembled UR to clipboard
- 10-second timeout with troubleshooting tips
- Camera fallback detection (desktop vs mobile)

**Tab 4 - Registry Browser (US4 - Priority P3)** ✅ 78% Complete
- Registry type enumeration (all 6 packages)
- Package grouping (blockchain-commons, coin-identity, sync, hex-string, sign, uuid)
- Collapsible type list with tag/URType/description
- CDDL viewer with CSS-based syntax highlighting
- Documentation links
- ⏳ **Remaining**:
  - T059: Type matching with converter tab
  - T060: Unregistered type indicator

### 🔄 Phase 7: Advanced Console Features (US5 - Priority P3) - 28% Complete

**Completed (5/18 tasks):**
- ✅ T062: Inline method execution (no-param methods)
- ✅ T063: Console hints for parameterized methods (integrated in T062)
- ✅ T064: Recursive inspector (integrated in T062)
- ✅ T065: Expandable type drawer with CDDL schema
- ✅ T066: bc-ur library exposed on console
- ✅ T067: ur-registry classes exposed on console
- ✅ T071: HTML for type drawer
- ✅ T072: CSS for type drawer
- ✅ T077: Optional parameter detection (try-catch execution)

**Planned Enhancements (9/18 tasks):**
- ⏳ T078: TypeScript definition service (fetch .d.ts from esm.sh)
- ⏳ T079: TypeScript signature parser (extract method params from .d.ts)
- ⏳ T080: Enhanced method execution UI (inline "Execute" button for optional params)
- ⏳ T081: Parameter input forms (smart inputs based on TypeScript types)
- ⏳ T082: Input validation against TypeScript types
- ⏳ T083: Method tooltips showing TypeScript signatures
- ⏳ T068: Console tips panel with bc-ur docs links
- ⏳ T069: Console instance detection ("Show in Property Inspector" for manually created items)

### ⏳ Phase 8: Polish & Accessibility - 0% Complete

**Remaining Work (4 tasks):**
- ⏳ T073: Mobile touch optimizations (larger tap targets, swipe hints)
- ⏳ T074: Tab focus/blur handlers (pause animations on blur)
- ⏳ T075: Accessibility attributes (ARIA labels, keyboard shortcuts)
- ⏳ T076: README update with live demo link

### 📊 Overall Progress

**Total Tasks**: 83 (76 base + 7 TypeScript integration tasks added 2025-10-16)
- ✅ **Completed**: 61 tasks (73%)
- ⏳ **Remaining**: 22 tasks (27%)
  - 13 tasks: Advanced console features (TypeScript integration)
  - 4 tasks: Polish & accessibility
  - 2 tasks: Registry browser enhancements
  - 2 tasks: Multi-UR generator (GIF export)
  - 1 task: README update

**Known Issues Resolved** (see `docs/history/`):
- ✅ Registry Item API corrections (`.type` property vs `.getRegistryType()` method)
- ✅ Optional parameter detection (try-catch execution strategy)
- ✅ Executable functions in tree view
- ✅ Property inspector UI redesign

## Code Architecture

### Current File Structure
```
index.html          # Main shell with tab navigation (✅ IMPLEMENTED)
demo.js            # Original demo backup - preserved for reference
js/                # ✅ IMPLEMENTED - Modular ES6 modules
  ├── converter.js       # Tab 1: Format Converter (1402 lines) ✅
  ├── multi-ur.js        # Tab 2: Multi-UR Generator & Animated QR ✅
  ├── scanner.js         # Tab 3: QR Scanner & Fountain Decoder ✅
  ├── registry.js        # Tab 4: Registry Browser ✅
  ├── registry-item-ui.js # Property Inspector & Console Integration (540 lines) ✅
  ├── registry-loader.js  # Dynamic registry package loading ✅
  ├── router.js          # Hash-based navigation ✅
  └── shared.js          # Common utilities (cache, debounce, errors) ✅
css/               # ✅ IMPLEMENTED - Modular stylesheets
  ├── main.css           # Global styles + registry item UI ✅
  └── tabs.css           # Tab-specific styles ✅
demo-backup/       # Original working demo preserved
  ├── demo.js
  └── index.html
docs/history/      # Archived feature/bugfix documentation
  ├── BUGFIX_REGISTRY_ITEM_API.md
  ├── QUICKFIX_OPTIONAL_PARAMS.md
  ├── FEATURE_TREE_EXECUTABLE_FUNCTIONS.md
  ├── FEATURE_INSPECTOR_ENHANCEMENTS.md
  ├── UI_REDESIGN_PROPERTY_INSPECTOR.md
  ├── REGISTRY_PACKAGES_INTEGRATION.md
  └── REGISTRY_ITEM_DECODING_UPDATE.md
specs/             # Speckit-generated feature specifications
  └── 002-bc-ur-playground/      # Current active feature
      ├── spec.md                # User stories, requirements, acceptance criteria
      ├── plan.md                # Implementation plan with tech stack
      ├── tasks.md               # 83 dependency-ordered tasks
      ├── research.md            # Phase 0 research output
      ├── data-model.md          # Data entities and relationships
      ├── quickstart.md          # Getting started guide
      ├── IMPLEMENTATION_STATUS.md    # Current progress tracking
      ├── IMPLEMENTATION_COMPLETE_2025-10-14.md  # Completed work log
      └── contracts/             # API contracts and schemas
          └── state-schema.md
.github/           # Project governance and workflows
  ├── copilot-instructions.md    # This file
  ├── prompts/                   # Speckit slash command prompts
  └── workflows/                 # GitHub Actions (CI/CD)
reference_projects/ # Read-only library examples (not deployed)
  ├── bc-ur/                     # Primary reference for bc-ur API
  ├── ur-registry/               # Registry patterns
  └── animated-QR-tool/          # QR animation examples
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

// Use UrFountainEncoder for multi-UR generation (see specs/002-bc-ur-playground/tasks.md Phase 5)
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

**Adding new console features:**
- Expose new utilities via `window.$cbor` namespace (inspect, diff, export patterns)
- Follow existing patterns for `window.$lastDecoded`, `window.$lastRegistryItem`
- Document all exposed APIs in console tips panel

**Prefer modifying existing helpers over parallel code paths—keep logic centralized.**

## Console API Reference

### Exposed bc-ur Library Classes
```javascript
window.UR                    // Core UR class - UR.fromString(), UR.pipeline
window.BytewordEncoding      // Bytewords encoder/decoder
window.UrFountainEncoder     // Multi-part UR encoder
window.UrFountainDecoder     // Multi-part UR decoder
window.UrRegistry            // Registry singleton
```

### Exposed Registry Item Classes (All Packages)
```javascript
// blockchain-commons
window.CryptoHDKey, window.CryptoSeed, window.CryptoPSBT, 
window.CryptoAccount, window.CryptoOutput, window.CryptoECKey

// coin-identity
window.CoinIdentity

// ur-sync
window.DetailedAccount, window.PortfolioCoin, 
window.PortfolioMetadata, window.Portfolio

// hex-string
window.HexString

// ur-sign
window.SignRequest, window.SignResponse

// uuid
window.UUID
```

### Auto-Exposed Decoded Data
```javascript
window.$lastDecoded         // Last decoded CBOR value (any format)
window.$lastRegistryItem    // Last decoded registry item instance
```

### CBOR Utilities Namespace
```javascript
window.$cbor.inspect(value)       // Detailed CBOR inspection
window.$cbor.diff(val1, val2)     // Compare two CBOR values
window.$cbor.export(value, fmt)   // Export to format (json/hex/ur)
window.$cbor.findType(value)      // Detect UR type from CBOR
window.$cbor.listTags()           // List all registered CBOR tags
```

### Registry Package Access
```javascript
window.registryPackages.blockchainCommons
window.registryPackages.coinIdentity
window.registryPackages.urSync
window.registryPackages.hexString
window.registryPackages.urSign
window.registryPackages.urUuid
```

## Performance & Testing

- **Debounce timing:** 150ms typing, 10ms paste (measured in `setupEventListeners`)
- **Cache eviction:** First-in-first-out when size > 120
- **No automated tests:** Manual validation via example buttons (hex/ur/bytewords/multiur)
- **Reference data:** Use `reference_projects/bc-ur/tests/` for complex test cases

## Planned Features (Future)

**⏳ Phase 7: TypeScript Integration (T078-T083)** - Advanced console features
- TypeScript definition service (fetch .d.ts from esm.sh)
- Method signature parser (extract parameter types and optional flags)
- Smart parameter input forms (type-aware UI for method execution)
- Parameter validation against TypeScript types
- Enhanced method tooltips with full TypeScript signatures
- Inline execution for methods with optional parameters

**⏳ Phase 8: Polish & Accessibility (T073-T076)** - UX improvements
- Mobile touch optimizations (larger tap targets, swipe gestures)
- Tab focus/blur handlers (pause animations when backgrounded)
- Accessibility attributes (ARIA labels, keyboard navigation)
- README updates with live demo link

**⏳ Multi-UR Generator Enhancements**
- T051: Animated GIF export from QR frames (using gif.js library)

**⏳ Registry Browser Enhancements**
- T059: Type matching with converter tab (highlight matching types)
- T060: Unregistered type indicator (show badge for unknown types)

**Future Enhancements (Not in Current Spec)**
- Shareable permalink (URL-encoded state, privacy reviewed)
- Batch processing (multiple URs simultaneously)
- Export formats (PDF, CSV beyond text/images)
- Performance profiler dashboard

**Do NOT implement these without explicit user request—focus on current tasks.**

## Non-Goals (Explicit)

- ❌ Wallet/signing functionality
- ❌ Encryption layer
- ❌ Server API calls
- ❌ Analytics/tracking
- ❌ User accounts
- ❌ Build tooling (Webpack/Vite) unless feature demands it

## Quick Start (Development)

**IMPORTANT**: Always check if server is running before starting a new one.

Serve locally:
```bash
# ALWAYS use yarn dev (checks if port is free first)
yarn dev

# Check if already running:
lsof -ti:8000  # If returns PID, server is running
```

Browser requirements: ES modules, Clipboard API, CSS Grid

## Security Notice

⚠️ **This demo is for development & inspection only. Not audited for handling secrets. Users are responsible for safeguarding sensitive material.**
