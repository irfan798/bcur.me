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

- [ ] **T001** Backup existing `index.html` and `demo.js` to `demo-backup/` folder (preserve working converter)
- [ ] **T002** Restructure `index.html` - Extract converter HTML into tab section, add tab navigation shell (#converter, #multi-ur, #scanner, #registry)
- [ ] **T003** [P] Create `css/main.css` - Extract global styles from `index.html` inline CSS (mobile-first, responsive grid)
- [ ] **T004** [P] Create `css/tabs.css` - Add tab navigation styles (hash-based routing UI, sticky header)
- [ ] **T005** Update `index.html` - Link external CSS files, keep existing example data buttons

**Checkpoint**: Multi-tab shell ready, existing converter preserved in Tab 1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract reusable utilities from demo.js and create routing infrastructure

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Existing Code in demo.js to Extract**:
- ✅ LRU cache logic (conversionCache Map)
- ✅ Debounce pattern (conversionTimer)
- ✅ Error handling (updateStatus, handleError patterns)

- [ ] **T006** Create `js/shared.js` - Extract LRU cache class from `demo.js` (conversionCache → reusable LRUCache class, 120 max entries)
- [ ] **T007** Add debounce utility to `js/shared.js` - Extract from `demo.js` setTimeout pattern (150ms typing, 10ms paste)
- [ ] **T008** Add error handling utilities to `js/shared.js` - Extract updateStatus/handleError patterns from `demo.js`
- [ ] **T009** Create `js/router.js` - Implement hash-based routing (tab switching based on window.location.hash)
- [ ] **T010** Add sessionStorage utilities to `js/router.js` - Cross-tab forwarding (setItem/getItem with TTL, clearOnUnload event)
- [ ] **T011** Create `js/registry-loader.js` - Dynamic ESM import wrapper for 6 ur-registry packages (loadRegistryPackage(key) function)
- [ ] **T012** Initialize router in `index.html` - Add router.init() on DOMContentLoaded (activate default #converter tab, handle deep links)

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

- [ ] **T013** [P] [US1] Create `js/converter.js` - Copy FormatConverter class from `demo.js` (lines 38-787)
- [ ] **T014** [US1] Refactor imports in `js/converter.js` - Add qrcode@1.5.3 import, update shared.js imports (replace inline cache/debounce with imported utilities)
- [ ] **T015** [US1] Update FormatConverter constructor in `js/converter.js` - Use LRUCache from shared.js instead of inline Map
- [ ] **T016** [US1] Update error handling in `js/converter.js` - Replace inline updateStatus with shared.js handleError/updateStatus
- [ ] **T017** [US1] Add console debug interface to `js/converter.js` - Implement window.$lastDecoded auto-exposure (new functionality from data-model.md)
- [ ] **T018** [US1] Add window.$cbor namespace to `js/converter.js` - Implement inspect(), diff(), export(), findType(), listTags() methods (new from data-model.md)
- [ ] **T019** [US1] Add "Send to Multi-UR Generator" button handler in `js/converter.js` - Forward single UR via sessionStorage to #multi-ur tab (new functionality)
- [ ] **T020** [US1] Update `index.html` converter tab - Ensure all existing UI elements have correct IDs for js/converter.js
- [ ] **T021** [US1] Update `index.html` script imports - Replace demo.js with js/converter.js module import
- [ ] **T022** [US1] Test refactored converter - Verify all existing demo.js functionality works in new modular structure

**Checkpoint**: User Story 1 complete - existing converter functionality preserved and enhanced with console debugging

---

## Phase 4: User Story 3 - QR Scanner & Fountain Decoder (Priority: P1)

**Goal**: Scan animated QR codes with mobile camera, decode multi-part URs with progress visualization

**Independent Test**: Open scanner on mobile → scan animated QR code → see grid visualization and progress → auto-forward to converter when complete

**Deliverables**: FR-021 through FR-033 (camera access, QR scanning, fountain decoder with grid viz, auto-forward, error handling)

**Note**: Implementing US3 before US2 because both are P1 priority and scanner is independent of generator

### Implementation for User Story 3

- [ ] **T028** [P] [US3] Create `js/scanner.js` with QRScanner class skeleton (constructor, state per contracts/state-schema.md)
- [ ] **T029** [US3] Implement camera initialization in `js/scanner.js` (MediaDevices API, permission handling, error display)
- [ ] **T030** [US3] Implement QR scanning in `js/scanner.js` (qr-scanner@1.4.2 with returnDetailedScanResult: true)
- [ ] **T031** [US3] Implement fountain decoder integration in `js/scanner.js` (UrFountainDecoder, receivePartUr() on each scan)
- [ ] **T032** [US3] Implement progress visualization in `js/scanner.js` (decodedBlocks bitmap → grid UI, green=decoded, gray=pending)
- [ ] **T033** [US3] Implement progress tracking in `js/scanner.js` (decoder.getProgress(), decoded/total blocks, percentage display)
- [ ] **T034** [US3] Implement UR type mismatch detection in `js/scanner.js` (compare urType across fragments, warning UI)
- [ ] **T035** [US3] Implement manual reset in `js/scanner.js` (decoder.reset(), clear grid visualization)
- [ ] **T036** [US3] Implement auto-forward on completion in `js/scanner.js` (isComplete → sessionStorage → navigate to #converter)
- [ ] **T037** [US3] Implement camera fallback detection in `js/scanner.js` (no camera → show mobile/paste fallback message)
- [ ] **T038** [US3] Implement permission revocation handling in `js/scanner.js` (detect permission change, show re-grant instructions)
- [ ] **T039** [US3] Add scanner tab HTML structure to `index.html` (video preview, grid container, progress display, reset button)

**Checkpoint**: User Story 3 complete - QR scanning fully functional on mobile, auto-forwards to US1 converter

---

## Phase 5: User Story 2 - Multi-Part UR Generation & Animated QR (Priority: P2)

**Goal**: Generate fountain-encoded multi-part URs and display as animated QR codes with configurable parameters

**Independent Test**: Paste UR or receive from converter → set encoder params → generate multi-part UR → see animated QR with controls

**Deliverables**: FR-011 through FR-020 (UR input, encoder params, generation, QR animation, controls, download/export)

### Implementation for User Story 2

- [ ] **T040** [P] [US2] Create `js/multi-ur.js` with MultiURGenerator class skeleton (constructor, state per contracts/state-schema.md)
- [ ] **T041** [US2] Implement input handling in `js/multi-ur.js` (receive from converter via sessionStorage, manual UR/hex entry)
- [ ] **T042** [US2] Implement encoder parameter UI in `js/multi-ur.js` (maxFragmentLength, minFragmentLength, firstSeqNum, repeatAfterRatio)
- [ ] **T043** [US2] Implement parameter validation in `js/multi-ur.js` (min < max, range checks, error display before encoding)
- [ ] **T044** [US2] Implement multi-part UR generation in `js/multi-ur.js` (UrFountainEncoder.getAllPartsUr(0) for pure fragments)
- [ ] **T045** [US2] Implement finite parts display in `js/multi-ur.js` (scrollable text list with part numbers when repeatAfterRatio > 0)
- [ ] **T046** [US2] Implement infinite streaming preview in `js/multi-ur.js` (cycles through parts when repeatAfterRatio = 0, synchronized with animation)
- [ ] **T047** [US2] Implement QR generation in `js/multi-ur.js` (qrcode@1.5.3 toCanvas, alphanumeric mode, configurable size/EC level) - **Verify QRCode.toCanvas uses alphanumeric mode per FR-016**
- [ ] **T048** [US2] Implement QR animation in `js/multi-ur.js` (requestAnimationFrame loop, frame rate control, current part indicator)
- [ ] **T049** [US2] Implement animation controls in `js/multi-ur.js` (play/pause/restart, speed adjustment, infinite looping for ratio=0)
- [ ] **T050** [US2] Implement download logic in `js/multi-ur.js` (text file export when finite, disable + guidance when infinite)
- [ ] **T051** [US2] Implement QR frame export in `js/multi-ur.js` (canvas toBlob, ZIP download of frames when finite)
- [ ] **T052** [US2] Add multi-UR generator tab HTML structure to `index.html` (input section, encoder params, QR settings, canvas, controls, text output)

**Checkpoint**: User Story 2 complete - multi-UR generation with animated QR fully functional

---

## Phase 6: User Story 4 - Registry Browser & Type Inspection (Priority: P3)

**Goal**: Browse registered UR types, view CDDL schemas, verify type registration

**Independent Test**: Open registry browser → see list of types → expand crypto-seed → view CDDL and documentation link

**Deliverables**: FR-034 through FR-039 (registry list, CDDL display, type matching, package grouping)

### Implementation for User Story 4

- [ ] **T053** [P] [US4] Create `js/registry.js` with RegistryBrowser class skeleton (constructor, state per contracts/state-schema.md)
- [ ] **T054** [US4] Implement registry type enumeration in `js/registry.js` (load all 6 packages, extract tag/urType/CDDL metadata)
- [ ] **T055** [US4] Implement package grouping in `js/registry.js` (group by blockchain-commons, coin-identity, sync, hex-string, sign, uuid)
- [ ] **T056** [US4] Implement collapsible type list UI in `js/registry.js` (package sections, type rows with tag/URType/description)
- [ ] **T057** [US4] Implement CDDL viewer in `js/registry.js` (expand type → show full CDDL with syntax highlighting)
- [ ] **T058** [US4] Implement documentation links in `js/registry.js` (link to official docs when available, null fallback)
- [ ] **T059** [US4] Implement type matching in `js/registry.js` (highlight registry entry when converter shows matching UR type)
- [ ] **T060** [US4] Implement unregistered type indicator in `js/registry.js` (show "unregistered" badge for unknown types)
- [ ] **T061** [US4] Add registry browser tab HTML structure to `index.html` (package sections, type list, CDDL viewer, search/filter)

**Checkpoint**: User Story 4 complete - registry browsing fully functional

---

## Phase 7: User Story 5 - Registry Item Interactive Console (Priority: P3)

**Goal**: Create and test registry items via browser console API for experimentation

**Independent Test**: Open converter → decode UR → see console hint → use window.registryPlayground.createItem() → encode/decode in console

**Deliverables**: FR-040 through FR-045 (console API exposure, createItem/encode/decode methods, auto-logging)

### Implementation for User Story 5

- [ ] **T062** [US5] Implement window.registryPlayground in `js/registry.js` (expose global object with createItem, encode, decode, validate methods)
- [ ] **T063** [US5] Implement createItem() in `js/registry.js` (accepts typeName + data, returns RegistryItem instance)
- [ ] **T064** [US5] Implement createFromDecoded() in `js/registry.js` (promotes window.$lastDecoded to editable registry item)
- [ ] **T065** [US5] Implement encode() in `js/registry.js` (RegistryItem → CBOR hex/UR/bytewords, console display)
- [ ] **T066** [US5] Implement decode() in `js/registry.js` (CBOR hex → JavaScript object, structure inspection)
- [ ] **T067** [US5] Implement validate() stub in `js/registry.js` (CDDL schema presence check, full validation post-MVP)
- [ ] **T068** [US5] Implement auto-logging in `js/registry.js` (created instances auto-log to console with expandable structure)
- [ ] **T069** [US5] Add console hints to converter in `js/converter.js` (show example commands when decoded JavaScript view displayed)

**Checkpoint**: All user stories complete - full feature set operational

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Tab-specific optimizations and final touches (demo.js already has error handling, caching, debouncing)

- [ ] **T063** [P] Add mobile touch optimizations to `css/tabs.css` (larger tap targets, swipe hints)
- [ ] **T064** [P] Add tab focus/blur handlers in `js/router.js` (pause animations on blur, resume on focus)
- [ ] **T065** [P] Add accessibility attributes to `index.html` (ARIA labels for tab navigation, keyboard shortcuts)
- [ ] **T066** Update README.md with live demo link, feature overview, browser requirements

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

**Phase 5 (US2 - Multi-UR)**:
- T040 [P] js/multi-ur.js skeleton || T052 [P] index.html multi-UR HTML

**Phase 6 (US4 - Registry)**:
- T053 [P] js/registry.js skeleton || T061 [P] index.html registry HTML

**Phase 8 (Polish)**:
- T070-T075 all [P] (different files: css, js/converter, js/multi-ur, js/router, index.html)

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

**Total Tasks**: **66 tasks** (reduced from 78 by leveraging existing demo.js)
- Phase 1 (Setup): 5 tasks - Refactor existing HTML into tabs
- Phase 2 (Foundational): 7 tasks - Extract utilities from demo.js
- Phase 3 (US1 - Converter): **10 tasks** 🎯 MVP - Refactor existing code (was 15)
- Phase 4 (US3 - Scanner): 12 tasks - New implementation
- Phase 5 (US2 - Multi-UR): 13 tasks - New implementation  
- Phase 6 (US4 - Registry): 9 tasks - New implementation
- Phase 7 (US5 - Console): 8 tasks - New implementation
- Phase 8 (Polish): 2 tasks - Reduced (demo.js already has error handling, caching, debouncing)

**Existing Code Reuse**:
- ✅ **demo.js (787 lines)** - Complete FormatConverter implementation
- ✅ **index.html (455 lines)** - Working converter UI
- 🔄 Refactor strategy: Extract → Modularize → Enhance

**Parallelization**: 17 tasks marked [P] (25% of total)

**User Story Distribution**:
- US1 (Converter): **10 tasks** (refactored from demo.js) - MVP deliverable
- US2 (Multi-UR Gen): 13 tasks - Independent
- US3 (Scanner): 12 tasks - Independent (mobile primary)
- US4 (Registry): 9 tasks - Independent
- US5 (Console): 8 tasks - Depends on US4 (registry.js)

**Independent Test Criteria**:
- ✅ US1: Paste UR → see all output formats + multi-part assembly
- ✅ US2: Input UR → generate multi-UR → see animated QR
- ✅ US3: Scan QR on mobile → see progress → auto-forward to converter
- ✅ US4: Browse registry → expand type → view CDDL
- ✅ US5: Decode UR → use console API → encode/decode registry items

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
