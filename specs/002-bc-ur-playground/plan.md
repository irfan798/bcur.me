# Implementation Plan: BC-UR Playground

**Branch**: `002-bc-ur-playground` | **Date**: 2025-10-08 | **Spec**: [spec.md](./spec.md)

## Summary

BC-UR Playground is a client-side web application for exploring Uniform Resources (URs), multi-part fountain encoding, animated QR codes, and CBOR registry types. Primary use cases: format conversion between UR/hex/bytewords/CBOR, multi-part UR generation with animated QR display, mobile QR scanning with fountain decoder, registry type inspection, and console-based registry item experimentation. Technical approach: vanilla JavaScript ES modules with bc-ur library integration, hash-based routing, sessionStorage for cross-tab state, MediaDevices API for camera access, and dynamic registry type loading.

## Technical Context

**Language/Version**: JavaScript ES2020+ (native ES modules, no transpilation)

**Primary Dependencies**: 
- Core: `@ngraveio/bc-ur@2.0.0-beta.9` (UR encoding/decoding, fountain encoder/decoder)
- Registry types (dynamically loadable):
  - `@ngraveio/ur-blockchain-commons` - BlockChain Commons types
  - `@ngraveio/ur-coin-identity` - Coin identity type
  - `@ngraveio/ur-sync` - Account/portfolio types
  - `@ngraveio/ur-hex-string` - Hex string encoding
  - `@ngraveio/ur-sign` - Sign request/response protocols
  - `@ngraveio/ur-uuid` - UUID type
- QR Generation: `qrcode@1.5.3` (canvas-based, alphanumeric mode support)
- QR Scanning: `qr-scanner@1.4.2` (Web Worker, mobile-optimized)
- Delivery: ESM via CDN (esm.sh with version pinning for production)

**Storage**: 
- Temporary: sessionStorage for cross-tab data forwarding (cleared on page unload)
- Cache: In-memory Map for conversion results (LRU, max 120 entries)
- No persistent storage (localStorage/IndexedDB excluded per constitution)

**Testing**: Manual QA via browser DevTools + example data buttons (no automated test framework initially)

**Target Platform**: 
- Desktop: Chrome 90+, Firefox 88+ (primary)
- Mobile: Chrome/Firefox mobile (camera access for QR scanning - primary use case)
- Safari 14+ (supported but not primary)

**Project Type**: Single-page web application (client-only, no backend)

**Performance Goals**: 
- Conversion: <500ms for payloads ≤10KB
- QR generation: <2s for URs generating ≤50 parts
- QR scanning: 15-frame animated UR decoded in <30s at 5fps
- Animation: maintain user-selected framerate ±1fps for ≤30 frames

**Constraints**: 
- HTTPS required (camera API secure context)
- Client-side processing only (no server calls)
- ES modules support required (no bundler/transpiler)
- Mobile-first UX (touch-optimized controls, responsive design)
- No UI frameworks (vanilla JS/HTML/CSS per user requirements)

**Scale/Scope**: 
- 4 tabs (converter, multi-UR generator, scanner, registry browser)
- ~50 functional requirements across tabs
- 6 ur-registry packages with dynamic loading capability
- Support for URs up to 20KB (with performance warnings)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check (2025-10-08 11:00 UTC)

#### I. Trust the Library
✅ **PASS** - Using `@ngraveio/bc-ur` library exclusively for all encoding/decoding operations. No reimplementation of UR pipelines, fountain encoding, or bytewords. Library methods: `UR.pipeline`, `BytewordEncoding`, `UrFountainEncoder`, `UrFountainDecoder`.

#### II. Client-First Architecture
✅ **PASS** - Pure client-side processing. No backend, no analytics, no external data transmission. sessionStorage only for temporary cross-tab state (cleared on unload). Sensitive UR data stays in browser.

#### III. Simplicity Over Abstractions
✅ **PASS** - Vanilla JavaScript with semantic HTML and modular CSS. No UI framework (per user requirement). No build tooling (pure ESM). Incremental adoption philosophy: start simple, add complexity only when justified.

#### IV. Explicit Errors
✅ **PASS** - All error paths display user-facing messages with context (e.g., "Invalid hex: odd length"). Console errors preserved for debugging. Pipeline visualization shows error states inline.

#### V. Fast Feedback
✅ **PASS** - Debounced inputs (150ms typing, 10ms paste), conversion caching (LRU Map, 120 entries), loading states for operations >200ms. Performance targets documented in spec success criteria.

#### VI. Reference Projects as Authority
✅ **PASS** - `reference_projects/bc-ur`, `reference_projects/ur-registry`, `reference_projects/animated-QR-tool` are READ-ONLY and authoritative. Implementation follows README → source → tests hierarchy.

#### VII. Deterministic & Inspectable
✅ **PASS** - Same input → same output (no random state, no timestamps in conversions). State in inspectable objects (FormatConverter class with public properties). DevTools-friendly (no minification in production).

**Pre-Phase 0 Result**: ✅ All gates passed. No violations requiring justification.

---

### Post-Phase 1 Check (2025-10-08 13:30 UTC)

#### I. Trust the Library
✅ **PASS** - Design artifacts confirm library-first approach:
- `data-model.md` UR entity: "Validation via `UR.fromString()` (never manual parse)"
- `contracts/state-schema.md` conversion paths: All use `UR.pipeline`, `BytewordEncoding`, `UrFountainEncoder/Decoder`
- `quickstart.md` implementation patterns: "Trust the Library" section with ✅ DO/❌ DON'T examples
- No custom CBOR/fountain implementations in any design document

#### II. Client-First Architecture
✅ **PASS** - Design maintains client-only architecture:
- `data-model.md` Session Transfer Payload: "Validation: max 5MB (privacy guard)"
- `contracts/state-schema.md` RouterState: sessionStorage with `clearOnUnload: true`
- `quickstart.md` dependencies: All CDN imports, no backend services
- `research.md` caching: In-memory Map only, no localStorage/IndexedDB

#### III. Simplicity Over Abstractions
✅ **PASS** - Design preserves vanilla JS approach:
- `contracts/state-schema.md`: TypeScript-style interfaces as JSDoc documentation (no runtime TypeScript)
- `quickstart.md` state management: "Explicit state updates" with vanilla patterns, "❌ DON'T: External state library (WRONG)"
- `plan.md` project structure: Modular JS files, no bundler/transpiler
- No framework dependencies introduced in any artifact

#### IV. Explicit Errors
✅ **PASS** - Error handling patterns formalized:
- `contracts/state-schema.md` AppError: `{ code, message, context, timestamp, severity, userMessage, technicalDetails }` schema
- `data-model.md` validation rules: Specific error messages for each validation failure
- `quickstart.md` error patterns: User-facing + console logging with ✅ DO/❌ DON'T examples
- `research.md` error handling: Centralized `handleError()` with contextual UI feedback

#### V. Fast Feedback
✅ **PASS** - Performance optimizations designed:
- `contracts/state-schema.md` cache: LRU Map with maxSize 120, hitRate tracking
- `data-model.md` Multi-Part UR Sequence: "Lifecycle: rendered → animating (cache frames)"
- `quickstart.md` performance benchmarks: Conversion <500ms, QR gen <2s, animation ±1fps
- `research.md` caching strategy: Map keyed by conversion inputs, 120-entry limit

#### VI. Reference Projects as Authority
✅ **PASS** - Design references authority hierarchy:
- `quickstart.md` Understanding the Feature: "Reference authority (when implementing): 1. bc-ur README, 2. source code, 3. tests"
- `data-model.md` UR entity: "Study `reference_projects/bc-ur/src/classes/UR.ts` before extending"
- All design artifacts cite reference projects for implementation patterns
- READ-ONLY status maintained (no modifications proposed)

#### VII. Deterministic & Inspectable
✅ **PASS** - Design ensures inspectability:
- `contracts/state-schema.md`: All state defined as inspectable JavaScript objects
- `quickstart.md` debugging: Console playground with `window.registryPlayground`, state inspection examples
- `data-model.md` state persistence: "Displayed in browser DevTools (Application → Session Storage)"
- No obfuscation/minification in design (readable source preserved)

**Post-Phase 1 Result**: ✅ All gates passed. Design artifacts reinforce constitution principles. No violations introduced.

---

**Constitution Compliance Summary**: ✅ Validated at 2 checkpoints (pre-Phase 0, post-Phase 1). Zero violations across all 7 principles.

## Project Structure

### Documentation (this feature)

```
specs/002-bc-ur-playground/
├── plan.md              # This file
├── research.md          # Phase 0 output (library integration patterns)
├── data-model.md        # Phase 1 output (entities and state)
├── quickstart.md        # Phase 1 output (developer setup)
├── contracts/           # Phase 1 output (internal state contracts)
│   └── state-schema.md  # Tab state definitions
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```
index.html               # Main shell with tab navigation
js/
├── converter.js         # Tab 1: Format converter (FormatConverter class)
├── multi-ur.js          # Tab 2: Multi-UR generator & animated QR
├── scanner.js           # Tab 3: QR scanner & fountain decoder
├── registry.js          # Tab 4: Registry browser & console playground
├── router.js            # Hash-based tab navigation
├── registry-loader.js   # Dynamic ur-registry package loading
└── shared.js            # Common utilities (debounce, cache, error handling)
css/
├── main.css             # Global styles
└── tabs.css             # Tab-specific styles
```

**Structure Decision**: Single-page web application structure chosen because:
- Client-only (no backend/frontend split needed)
- Tab-based navigation fits hash routing naturally
- Shared utilities minimize duplication across tabs
- Modular JS files enable lazy loading (future optimization if needed)
- Flat structure keeps cognitive load low (matches constitution's simplicity principle)

## Complexity Tracking

*No violations - section left empty per constitution compliance*
