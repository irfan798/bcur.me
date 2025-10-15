# Tasks: BC-UR Playground

**Input**: Design documents from `/specs/002-bc-ur-playground/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅  
**Branch**: `002-bc-ur-playground`  
**Generated**: 2025-10-08

**Existing Code**: ✅ `demo.js` + `index.html` have working converter (US1) - refactor into multi-tab architecture

**Tests**: Not requested in spec - manual QA via browser DevTools

**Organization**: Tasks grouped by user story (US1-US5) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- File paths are absolute from repository root

## Path Conventions (Single-Page Web App)
- `index.html` - Main application shell
- `js/*.js` - Modular JavaScript files (ES modules)
- `css/*.css` - Stylesheets
- No build tools - pure ESM via CDN

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Refactor existing demo into multi-tab architecture

**Existing Assets**:
- ✅ `index.html` - Has working converter UI and FormatConverter class integration
- ✅ `demo.js` - Complete FormatConverter implementation (US1 functionality)
- ✅ CDN imports configured (@ngraveio/bc-ur@2.0.0-beta.9)

- [x] **T001** Backup existing `index.html` and `demo.js` to `demo-backup/` folder (preserve working converter)
- [x] **T002** Restructure `index.html` - Extract converter HTML into tab section, add tab navigation shell (#converter, #multi-ur, #scanner, #registry)
- [x] **T003** [P] Create `css/main.css` - Extract global styles from `index.html` inline CSS (mobile-first, responsive grid)
- [x] **T004** [P] Create `css/tabs.css` - Add tab navigation styles (hash-based routing UI, sticky header)
- [x] **T005** Update `index.html` - Link external CSS files, keep existing example data buttons

**Checkpoint**: Multi-tab shell ready, existing converter preserved in Tab 1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract reusable utilities from demo.js and create routing infrastructure

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Existing Code in demo.js to Extract**:
- ✅ LRU cache logic (conversionCache Map)
- ✅ Debounce pattern (conversionTimer)
- ✅ Error handling (updateStatus, handleError patterns)

- [x] **T006** Create `js/shared.js` - Extract LRU cache class from `demo.js` (conversionCache → reusable LRUCache class, 120 max entries)
- [x] **T007** Add debounce utility to `js/shared.js` - Extract from `demo.js` setTimeout pattern (150ms typing, 10ms paste)
- [x] **T008** Add error handling utilities to `js/shared.js` - Extract updateStatus/handleError patterns from `demo.js`
- [x] **T009** Create `js/router.js` - Implement hash-based routing (tab switching based on window.location.hash, default to #converter when hash is empty or invalid)
- [x] **T010** Add sessionStorage utilities to `js/router.js` - Cross-tab forwarding (setItem/getItem with TTL, clearOnUnload event)
- [x] **T011** Create `js/registry-loader.js` - Dynamic ESM import wrapper for 6 ur-registry packages (loadRegistryPackage(key) function)
- [x] **T012** Initialize router in `index.html` - Add router.init() on DOMContentLoaded (activate default #converter tab, handle deep links)

**Checkpoint**: Foundation ready - existing converter code can be refactored into js/converter.js

---

## Phase 3: User Story 1 - Format Conversion & Inspection (Priority: P1) 🎯 MVP

**Goal**: Refactor existing working converter from demo.js into modular js/converter.js

**Independent Test**: Paste a UR string → see hex, bytewords, decoded CBOR views. Paste multi-part UR → see assembly progress and decoded result.

**Deliverables**: FR-001 through FR-010 (format detection, conversion, multi-part assembly, pipeline viz, error handling, copy-to-clipboard, forward to Tab 2)

**Existing Implementation in demo.js** ✅:
- FormatConverter class with all core methods
- detectFormat() - auto-detection working
- assembleMultiUR() - fountain decoder integration
- performConversion() - full pipeline
- Bytewords styles (minimal/standard/uri)
- Decoded CBOR views (JSON/Diagnostic/Commented/JavaScript)
- Pipeline visualization
- Copy-to-clipboard
- UR type detection and manual override

### Implementation for User Story 1 (Refactoring Existing Code)

- [x] **T013** [P] [US1] Create `js/converter.js` - Copy FormatConverter class from `demo.js` (lines 38-787)
- [x] **T014** [US1] Refactor imports in `js/converter.js` - Add qrcode@1.5.3 import, update shared.js imports (replace inline cache/debounce with imported utilities)
- [x] **T015** [US1] Update FormatConverter constructor in `js/converter.js` - Use LRUCache from shared.js instead of inline Map
- [x] **T016** [US1] Update error handling in `js/converter.js` - Replace inline updateStatus with shared.js handleError/updateStatus
- [x] **T017** [US1] Add console debug interface to `js/converter.js` - Implement window.$lastDecoded auto-exposure (new functionality from data-model.md)
- [x] **T018** [US1] Add window.$cbor namespace to `js/converter.js` - Implement inspect(), diff(), export(), findType(), listTags() methods (new from data-model.md)
- [x] **T019** [US1] Add "Send to Multi-UR Generator" button handler in `js/converter.js` - Forward single UR via sessionStorage to #multi-ur tab (new functionality)
- [x] **T020** [US1] Update `index.html` converter tab - Ensure all existing UI elements have correct IDs for js/converter.js
- [x] **T021** [US1] Update `index.html` script imports - Replace demo.js with js/converter.js module import
- [x] **T022** [US1] Test refactored converter - Verify all existing demo.js functionality works in new modular structure
- [x] **T022a** [US1] Add registry package imports to `js/converter.js` - Import all 6 ur-registry packages (@ngraveio/ur-blockchain-commons@2.0.1-beta.2, @ngraveio/ur-coin-identity@2.0.1-beta.2, @ngraveio/ur-sync@2.0.1-beta.2, @ngraveio/ur-hex-string@2.0.1-beta.2, @ngraveio/ur-sign@2.0.1-beta.2, @ngraveio/ur-uuid@2.0.1-beta.2) with console logging for verification
- [x] **T022b** [US1] Add expandable tree view renderer for registry items in `js/converter.js` - DevTools-style collapsible property inspector with ▶/▼ icons, nested object expansion, show property types
- [x] **T022c** [US1] Add methods display panel in `js/converter.js` - Show common registry methods (toUR(), getRegistryType(), toCBOR()) with toggle for type-specific methods, clickable to copy method call examples
- [x] **T022d** [US1] Add interactive console hints UI in `js/converter.js` - When registry item decoded, show hint panel in output area with copy-paste examples (not just console.log)
- [x] **T022e** [US1] Add method documentation tooltips in `js/converter.js` - Hover over method names to see parameter info and return types (extract from class definitions)
- [x] **T022f** [US1] Implement copy-to-clipboard options for registry items in `js/converter.js` - Add "Copy as JSON", "Copy as Hex", "Copy as UR", "Copy Registry Item Code" buttons
- [x] **T022g** [US1] Update `index.html` converter output section - Add div containers for registry item tree view, methods panel, console hints panel
- [x] **T022h** [US1] Add CSS styles for registry item UI to `css/main.css` - Styles for tree view (▶/▼ icons, indentation), methods panel (common/type toggle), hints panel, tooltips

**Checkpoint**: User Story 1 complete - existing converter functionality preserved and enhanced with console debugging + registry packages loaded + full registry item UI

---

## Phase 4: User Story 3 - QR Scanner & Fountain Decoder (Priority: P1)

**Goal**: Scan animated QR codes with mobile camera, decode multi-part URs with progress visualization

**Independent Test**: Open scanner on mobile → scan animated QR code → see grid visualization and progress → auto-forward to converter when complete

**Deliverables**: FR-021 through FR-033 (camera access, QR scanning, fountain decoder with grid viz, auto-forward, error handling)

**Note**: Implementing US3 before US2 because both are P1 priority and scanner is independent of generator

### Implementation for User Story 3

- [x] **T028** [P] [US3] Create `js/scanner.js` with QRScanner class skeleton (constructor, state per contracts/state-schema.md)
- [x] **T029** [US3] Implement camera initialization in `js/scanner.js` (MediaDevices API, permission handling, error display)
- [x] **T030** [US3] Implement QR scanning in `js/scanner.js` (qr-scanner@1.4.2 with returnDetailedScanResult: true)
- [x] **T030a** [US3] Implement no-QR timeout detection in `js/scanner.js` (10-second timer starts after camera ready, shows troubleshooting tips: "Hold camera steady", "Ensure good lighting", "QR code fully visible")
- [x] **T031** [US3] Implement fountain decoder integration in `js/scanner.js` (UrFountainDecoder, receivePartUr() on each scan)
- [x] **T032** [US3] Implement progress visualization in `js/scanner.js` (decodedBlocks bitmap → grid UI, green=decoded, gray=pending)
- [x] **T033** [US3] Implement progress tracking in `js/scanner.js` (decoder.getProgress(), decoded/total blocks, percentage display)
- [x] **T034** [US3] Implement UR type mismatch detection in `js/scanner.js` (compare urType across fragments, warning UI)
- [x] **T035** [US3] Implement manual reset in `js/scanner.js` (decoder.reset(), clear grid visualization)
- [x] **T036** [US3] Implement auto-forward on completion in `js/scanner.js` (isComplete → sessionStorage → navigate to #converter)
- [x] **T036a** [US3] Implement copy-to-clipboard in `js/scanner.js` (copy assembled UR string after 100% completion)
- [x] **T037** [US3] Implement camera fallback detection in `js/scanner.js` (no camera → show mobile/paste fallback message)
- [x] **T038** [US3] Implement permission revocation handling in `js/scanner.js` (detect permission change, show re-grant instructions)
- [x] **T039** [US3] Add scanner tab HTML structure to `index.html` (video preview, grid container, progress display, reset button)

**Checkpoint**: User Story 3 complete - QR scanning fully functional on mobile, auto-forwards to US1 converter

---

## Phase 5: User Story 2 - Multi-Part UR Generation & Animated QR (Priority: P2)

**Goal**: Generate fountain-encoded multi-part URs and display as animated QR codes with configurable parameters

**Independent Test**: Paste UR or receive from converter → set encoder params → generate multi-part UR → see animated QR with controls

**Deliverables**: FR-011 through FR-020 (UR input, encoder params, generation, QR animation, controls, download/export)

### Implementation for User Story 2

- [x] **T040** [P] [US2] Create `js/multi-ur.js` with MultiURGenerator class skeleton (constructor, state per contracts/state-schema.md)
- [x] **T041** [US2] Implement input handling in `js/multi-ur.js` (receive from converter via sessionStorage, manual UR/hex entry)
- [x] **T042** [US2] Implement encoder parameter UI in `js/multi-ur.js` (maxFragmentLength, minFragmentLength, firstSeqNum, repeatAfterRatio)
- [x] **T043** [US2] Implement parameter validation in `js/multi-ur.js` (min < max, range checks, error display before encoding)
- [x] **T044** [US2] Implement multi-part UR generation in `js/multi-ur.js` (UrFountainEncoder.getAllPartsUr(0) for pure fragments)
- [x] **T045** [US2] Implement finite parts display in `js/multi-ur.js` (scrollable text list with part numbers when repeatAfterRatio > 0)
- [x] **T046** [US2] Implement infinite streaming preview in `js/multi-ur.js` (cycles through parts when repeatAfterRatio = 0, synchronized with animation)
- [x] **T047** [US2] Implement QR generation in `js/multi-ur.js` (qrcode@1.5.3 toCanvas with `options: {errorCorrectionLevel: 'L'}` - alphanumeric mode auto-detected by library)
- [x] **T048** [US2] Implement QR animation in `js/multi-ur.js` (requestAnimationFrame loop, frame rate control, current part indicator)
- [x] **T049** [US2] Implement animation controls in `js/multi-ur.js` (play/pause/restart, speed adjustment, infinite looping for ratio=0)
- [x] **T049a** [US2] Implement encoder blocks grid visualization in `js/multi-ur.js` (shows which original blocks each fragment contains, updates with animation)
- [ ] **T050** [US2] ~~Implement download logic~~ REMOVED - Replaced by GIF export (T051)
- [x] **T050a** [US2] Implement copy-to-clipboard in `js/multi-ur.js` (copy individual part, copy all parts as text, copy current QR as PNG)
- [ ] **T051** [US2] Implement animated GIF export in `js/multi-ur.js` (using gif.js library, finite mode only, disabled with tooltip in infinite mode)
- [x] **T052** [US2] Add multi-UR generator tab HTML structure to `index.html` (input section, encoder params, QR settings, canvas, controls, text output, encoder blocks grid)

**Checkpoint**: User Story 2 complete - multi-UR generation with animated QR fully functional

---

## Phase 6: User Story 4 - Registry Browser & Type Inspection (Priority: P3)

**Goal**: Browse registered UR types, view CDDL schemas, verify type registration

**Independent Test**: Open registry browser → see list of types → expand crypto-seed → view CDDL and documentation link

**Deliverables**: FR-034 through FR-039 (registry list, CDDL display, type matching, package grouping)

### Implementation for User Story 4

- [x] **T053** [P] [US4] Create `js/registry.js` with RegistryBrowser class skeleton (constructor, state per contracts/state-schema.md)
- [x] **T054** [US4] Implement registry type enumeration in `js/registry.js` (load all 6 packages, extract tag/urType/CDDL metadata)
- [x] **T055** [US4] Implement package grouping in `js/registry.js` (group by blockchain-commons, coin-identity, sync, hex-string, sign, uuid)
- [x] **T056** [US4] Implement collapsible type list UI in `js/registry.js` (package sections, type rows with tag/URType/description)
- [x] **T057** [US4] Implement CDDL viewer in `js/registry.js` (expand type → show full CDDL with CSS-based syntax highlighting: keywords in blue, types in green, comments in gray - no external library, keep simple per constitution)
- [x] **T058** [US4] Implement documentation links in `js/registry.js` (link to official docs when available, null fallback)
- [x] **T059** [US4] Implement type matching in `js/registry.js` (highlight registry entry when converter shows matching UR type)
- [x] **T060** [US4] Implement unregistered type indicator in `js/registry.js` (show "unregistered" badge for unknown types)
- [x] **T061** [US4] Add registry browser tab HTML structure to `index.html` (package sections, type list, CDDL viewer, search/filter)

**Checkpoint**: User Story 4 complete - registry browsing fully functional

---

## Phase 7: User Story 5 - Registry Item Interactive Console (Priority: P3)

**Goal**: Enable developers to use bc-ur library natively on console with property inspector integration

**Independent Test**: Decode UR → see wide property inspector → click methods (execute inline or get console hints) → use bc-ur classes directly on console

**Deliverables**: FR-040 through FR-052 (wide tree view, clickable methods, inline execution, console integration, expandable type drawer)

### Implementation for User Story 5 (NEW Requirements - Updated 2025-10-14)

**COMPLETED (Already Implemented in T022b-T022h)**:
- [x] Wide property inspector tree view (FR-040) - Implemented in T022b
- [x] Methods panel with common/type-specific toggle (FR-041) - Implemented in T022c  
- [x] Copy-to-clipboard options (FR-046) - Implemented in T022f
- [x] Tree view CSS styles (FR-040) - Implemented in T022h

**NEW Tasks (Based on Updated Spec)**:

- [x] **T062** [US5] Add inline method execution to `js/registry-item-ui.js` (FR-042: no-param methods execute directly, results expand in-place in tree view)
- [x] **T063** [US5] Add console hints for parameterized methods in `js/registry-item-ui.js` (FR-043: show method signature with placeholder, e.g., `item.validate(schema) // Copy to console`) - IMPLEMENTED in T062
- [x] **T064** [US5] Implement recursive inspector for method results in `js/registry-item-ui.js` (FR-044: when method returns registry item, render nested tree with same interactive capabilities) - IMPLEMENTED in T062
- [x] **T077** [US5] Improve optional parameter detection in `js/registry-item-ui.js` - Add `.length` check to distinguish methods with optional params (e.g., `toString(hardenedFlag?)` has length=0 but should execute inline since optional)
- [ ] **T078** [US5] Add TypeScript definition service to `js/registry-item-ui.js` - Create `fetchTypeScriptDefinition(packageName, className)` to load .d.ts from esm.sh and cache results in Map
- [ ] **T079** [US5] Add TypeScript signature parser to `js/registry-item-ui.js` - Create `parseMethodSignature(dtsContent, methodName)` to extract parameters from .d.ts using regex (e.g., `toString(hardenedFlag?: "'" | 'h'): string;` → `[{name: 'hardenedFlag', optional: true, type: "'" | 'h"}]`)
- [ ] **T080** [US5] Enhance method execution UI in `js/registry-item-ui.js` - For optional param methods: show inline "Execute" button + tooltip "(optional params will use defaults)", keep existing console hint as secondary option
- [ ] **T081** [US5] Add parameter input forms to method execution in `js/registry-item-ui.js` - When .d.ts available and method has required params, render inline form with smart inputs based on TypeScript types (string → text input, number → number input, enum → dropdown)
- [ ] **T082** [US5] Add validation to parameter input forms in `js/registry-item-ui.js` - Validate user input against TypeScript type before execution (e.g., enum values must match definition, numbers must be numeric)
- [ ] **T083** [US5] Update method tooltips to show TypeScript signatures in `js/registry-item-ui.js` (FR-051: hover over method to see full signature from .d.ts, e.g., `toString(hardenedFlag?: "'" | 'h'): string`)
- [x] **T065** [US5] Add expandable type drawer to converter output in `js/converter.js` (FR-045: show CDDL schema, tag, package, docs link from registry browser - collapsed by default)
- [x] **T066** [US5] Expose bc-ur library natively on console in `js/converter.js` (FR-047: UR, BytewordEncoding, UrFountainEncoder, UrFountainDecoder globally accessible)
- [x] **T067** [US5] Expose ur-registry classes on console in `js/converter.js` (FR-048: CryptoHDKey, CryptoSeed, etc. from all 6 loaded packages)
- [ ] **T068** [US5] Add console tips panel to registry item UI in `js/registry-item-ui.js` (FR-049: show bc-ur library documentation links and usage patterns) - PARTIAL (exists but needs docs links)
- [ ] **T069** [US5] Implement console instance detection in `js/converter.js` (FR-050: detect registry items created in console, offer "Show in Property Inspector" action)
- [x] **T070** [US5] Add method documentation tooltips to methods panel in `js/registry-item-ui.js` (FR-051: hover to see parameters and return type) - SUPERSEDED by T083 (TypeScript signature tooltips)
- [x] **T071** [US5] Update HTML for expandable type drawer in `index.html` (add drawer container in converter output section)
- [x] **T072** [US5] Add CSS for type drawer and wider property inspector in `css/main.css` (drawer animation, wider tree layout)

**Checkpoint**: All user stories complete - full feature set operational with native bc-ur console integration

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Tab-specific optimizations and final touches (demo.js already has error handling, caching, debouncing)

- [x] **T073** [P] Add mobile touch optimizations to `css/tabs.css` (larger tap targets, swipe hints)
- [x] **T074** [P] Add tab focus/blur handlers in `js/router.js` (pause animations on blur, resume on focus)
- [x] **T075** [P] Add accessibility attributes to `index.html` (ARIA labels for tab navigation, keyboard shortcuts)
- [x] **T076** Update README.md with live demo link, feature overview, browser requirements

**Checkpoint**: Feature complete, polished, and ready for deployment

---

## Dependencies & Execution Strategy

### User Story Dependency Graph

```
Setup (Phase 1) → Foundational (Phase 2) → [All User Stories Can Start in Parallel]
                                              ↓
                           ┌──────────────────┼──────────────────┐
                           ↓                  ↓                  ↓
                     US1 (P1) 🎯          US3 (P1)           US2 (P2)
                  (Converter)           (Scanner)         (Multi-UR Gen)
                           ↓                  ↓                  ↓
                           └──────────────────┼──────────────────┘
                                              ↓
                           ┌──────────────────┴──────────────────┐
                           ↓                                     ↓
                     US4 (P3)                               US5 (P3)
                (Registry Browser)                    (Console Playground)
                           ↓                                     ↓
                           └──────────────────┬──────────────────┘
                                              ↓
                                         Polish (Phase 8)
```

### Critical Path (MVP)
1. Phase 1 (Setup) → Phase 2 (Foundational) → **Phase 3 (US1 - Converter)** ← MVP COMPLETE HERE
2. Remaining user stories can be added incrementally

### Parallel Execution Opportunities

**Phase 1 (Setup)**: T002 [P] css/main.css || T003 [P] css/tabs.css (both in parallel)

**Phase 2 (Foundational)**: All tasks sequential due to shared.js dependencies

**Phase 3 (US1 - Converter)**: 
- T013 [P] js/converter.js skeleton (standalone)
- T027 [P] index.html converter tab HTML (can start while converter.js is being built)

**Phase 4 (US3 - Scanner)**:
- T028 [P] js/scanner.js skeleton || T039 [P] index.html scanner HTML
- T030a implements 10-second timeout (FR-031)
- T036a implements clipboard for scanned UR (FR-009)

**Phase 5 (US2 - Multi-UR)**:
- T040 [P] js/multi-ur.js skeleton || T052 [P] index.html multi-UR HTML
- T050a implements clipboard for multi-UR output (FR-009)

**Phase 6 (US4 - Registry)**:
- T053 [P] js/registry.js skeleton || T061 [P] index.html registry HTML

**Phase 8 (Polish)**:
- T070-T073 all [P] (different files: css, js/router, index.html, README.md)

### Implementation Strategy

**Leverage Existing Code** ✅:
- `demo.js` has complete US1 (Converter) implementation
- Refactor existing FormatConverter class into modular architecture
- Extract utilities (cache, debounce, errors) into shared.js
- Add new features: console debug API, multi-tab forwarding

**MVP (Minimum Viable Product)**:
- Complete Phases 1-3 only (Setup + Foundational + US1 Converter refactored)
- Delivers core value: format conversion and inspection
- **Only 22 tasks (T001-T022)** - reduced from 27 by reusing demo.js
- Timeline: 2-3 days for solo developer (vs 3-5 days from scratch)

**Full Feature Set**:
- Complete all phases (1-8)
- 68 tasks total (reduced from 78 by leveraging existing converter)
- Timeline: 8-12 days for solo developer (vs 10-14 from scratch)

**Incremental Delivery**:
1. **Week 1**: MVP (US1 Converter refactored) - deploy existing demo in multi-tab shell
2. **Week 2**: Add US3 (Scanner) + US2 (Multi-UR Generator) - mobile workflow complete
3. **Week 3**: Add US4 (Registry) + US5 (Console) - developer tools complete
4. **Week 4**: Polish and optimization

---

## Task Summary

**Total Tasks**: **83 tasks** (76 base + 7 new for TypeScript definition integration, updated 2025-10-16)
- Phase 1 (Setup): 5 tasks - Refactor existing HTML into tabs
- Phase 2 (Foundational): 7 tasks - Extract utilities from demo.js
- Phase 3 (US1 - Converter): **10 tasks** 🎯 MVP - Refactor existing code (was 15)
- Phase 4 (US3 - Scanner): 14 tasks (includes clipboard + timeout) - New implementation
- Phase 5 (US2 - Multi-UR): 14 tasks (includes clipboard) - New implementation
- Phase 6 (US4 - Registry): 9 tasks - New implementation
- Phase 7 (US5 - Console): **18 tasks** (updated 2025-10-16) - Native bc-ur console integration + TypeScript definition parser
- Phase 8 (Polish): 4 tasks (T073-T076) - Cross-cutting concerns

**Existing Code Reuse**:
- ✅ **demo.js (787 lines)** - Complete FormatConverter implementation
- ✅ **index.html (455 lines)** - Working converter UI
- ✅ **js/registry-item-ui.js** - Partial implementation of property inspector (T022b-T022h complete)
- 🔄 Refactor strategy: Extract → Modularize → Enhance

**Parallelization**: 17 tasks marked [P] (22% of 76 total)

**User Story Distribution**:
- US1 (Converter): **10 tasks** (refactored from demo.js) - MVP deliverable
- US2 (Multi-UR Gen): 13 tasks - Independent
- US3 (Scanner): 12 tasks - Independent (mobile primary)
- US4 (Registry): 9 tasks - Independent
- US5 (Console): **18 tasks** (updated 2025-10-16) - Native bc-ur integration + TypeScript definition parser for smart parameter handling

**Independent Test Criteria**:
- ✅ US1: Paste UR → see all output formats + multi-part assembly + wide property inspector for registry items
- ✅ US2: Input UR → generate multi-UR → see animated QR
- ✅ US3: Scan QR on mobile → see progress → auto-forward to converter
- ✅ US4: Browse registry → expand type → view CDDL
- ✅ US5: Decode UR → see wide property inspector → click methods (inline execution or console hints) → use native bc-ur classes on console

**Files to Create** (in order):
1. `demo-backup/` folder (T001 - preserve existing working code)
2. `css/main.css` (T003 - extract from index.html)
3. `css/tabs.css` (T004 - tab navigation)
4. `js/shared.js` (T006-T008 - extract from demo.js)
5. `js/router.js` (T009-T010, T012)
6. `js/registry-loader.js` (T011)
7. `js/converter.js` (T013-T019 - refactored from demo.js)
8. Update `index.html` (T002, T005, T020-T021 - multi-tab structure)
9. `js/scanner.js` (T023-T034 - new)
10. `js/multi-ur.js` (T035-T047 - new)
11. `js/registry.js` (T048-T062 - new)

**Existing Files to Preserve**:
- ✅ `demo.js` - Backup to demo-backup/, reference for implementation patterns
- ✅ `index.html` - Refactor into multi-tab, keep converter HTML in Tab 1

Ready for implementation with **accelerated timeline** thanks to existing code! 🚀
