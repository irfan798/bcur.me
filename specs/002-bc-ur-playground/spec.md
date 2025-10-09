# Feature Specification: BC-UR Playground

**Feature Branch**: `002-bc-ur-playground`  
**Created**: 2025-10-08  
**Status**: Draft  
**Input**: User description: "Focus of this project is to allow (mostly) developers and users to have a playground with bc-ur library and animated qr codes, See what is contained in the qr codes and multi-urs, check if the type is in the `ur-registry` be able to debug decoded cbor content. Live play with Registry Items on console and check what is it capable of. If there is an error in their implementation be the source of truth for those libraries. It should also work in mobile browsers because its easier to access camera on you phone for decoding animated qr codes that are composed of multi-part UR code. Also to understand what data is encoded on their wallet that uses urs and make sure their wallet is not sending their mnemonic or private keys etc. Basically online implementation of https://github.com/blockchaincommons/URDemo"

## Clarifications

### Session 2025-10-08
- Q: When users set `repeatAfterRatio = 0` (infinite looping), what should happen with animation playback and download/export behavior? → A: Loop animation indefinitely but disable downloads, suppress full text list, and present streaming preview that updates as each next part is requested.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Format Conversion & Inspection (Priority: P1)

Developers and users need to convert between different UR representations (UR string, bytewords, hex, CBOR) and inspect decoded content to understand what data is encoded in their URs.

**Why this priority**: Core functionality - without format conversion and inspection, the tool has no value. This is the foundation for all other features.

**Independent Test**: Can be fully tested by pasting a UR string and seeing it converted to hex, bytewords, and decoded CBOR views. Delivers immediate value for understanding UR contents.

**Acceptance Scenarios**:

1. **Given** a valid single-part UR string, **When** user pastes it into the converter, **Then** system displays UR type, hex representation, bytewords (minimal/standard/URI styles), and decoded CBOR in multiple views (JSON, diagnostic, commented, JavaScript)
2. **Given** hex input, **When** user provides UR type, **Then** system generates valid UR string and bytewords
3. **Given** multi-part UR text (multiple lines with ur: prefix), **When** user pastes it, **Then** system assembles parts using fountain decoder and displays decoded content with completion progress
4. **Given** decoded CBOR content, **When** user inspects registry type, **Then** system shows whether type is registered in ur-registry and links to documentation
5. **Given** invalid input, **When** conversion fails, **Then** system shows specific error message indicating what broke and at which pipeline stage

---

### User Story 2 - Multi-Part UR Generation & Animated QR Display (Priority: P2)

Developers need to generate multi-part fountain-encoded URs and display them as animated QR codes to test wallet integrations and understand fountain encoding behavior.

**Why this priority**: Essential for testing wallet QR scanning implementations and understanding how multi-part URs work. Complements the converter by showing the encoding side.

**Independent Test**: Can be fully tested by taking a hex/UR input, generating multi-part URs, and displaying animated QR code. Delivers value for wallet developers testing QR scanning.

**Acceptance Scenarios**:

1. **Given** a single UR or hex input, **When** user specifies fountain encoder parameters (max fragment length, min fragment length, sequence number, repeat ratio), **Then** system generates multi-part URs and displays them as text or streaming preview as appropriate
2. **Given** generated multi-part URs, **When** user configures QR settings (size, error correction, frame rate), **Then** system displays animated QR code with current part indicator, looping indefinitely when repeatAfterRatio = 0
3. **Given** animated QR running, **When** user clicks play/pause/restart controls, **Then** animation responds immediately
4. **Given** generated parts with finite repeats, **When** user clicks download, **Then** system provides options to export as text file or frames; if repeatAfterRatio = 0, system disables downloads and shows guidance to pick a finite repeat
5. **Given** invalid fountain parameters (e.g., min > max), **When** user attempts generation, **Then** system shows validation error before attempting encoding

---

### User Story 3 - QR Scanner & Fountain Decoder (Priority: P1)

Mobile users need to scan animated QR codes from wallets/devices using their phone camera to decode multi-part URs and understand what data is being transmitted.

**Why this priority**: Primary use case - mobile camera access for scanning animated QR codes. This is why mobile browser support is critical.

**Independent Test**: Can be fully tested by scanning an animated QR code with phone camera and seeing decoded UR content with progress tracking. Delivers immediate value for users inspecting wallet QR codes.

**Acceptance Scenarios**:

1. **Given** user opens scanner tab on mobile browser, **When** camera permission is granted, **Then** live video preview appears with QR detection overlay
2. **Given** animated multi-part QR code on screen, **When** camera scans each frame, **Then** system displays grid showing decoded blocks (green=decoded, gray=pending) with completion percentage
3. **Given** fountain decoding in progress, **When** user scans seen blocks again, **Then** grid shows seen blocks without re-processing, progress continues smoothly
4. **Given** decoding reaches 100%, **When** final block is received, **Then** system auto-forwards assembled UR to converter tab and displays full decoded content
5. **Given** user is scanning crypto-seed UR, **When** camera detects different UR type (e.g., PSBT), **Then** system displays warning about type mismatch and offers to reset decoder state
6. **Given** decoding in progress, **When** user clicks reset button, **Then** fountain decoder state clears and scanner ready for new UR sequence
7. **Given** camera permission denied, **When** user accesses scanner, **Then** system shows clear error message with instructions to grant permission

---

### User Story 4 - Registry Browser & Type Inspection (Priority: P3)

Developers need to browse all registered UR types, view their CDDL schemas, and verify whether scanned URs match known registry types.

**Why this priority**: Helpful for understanding the ur-registry ecosystem and debugging unknown types, but not essential for core conversion/scanning workflows.

**Independent Test**: Can be fully tested by browsing registry list, viewing CDDL for a type (e.g., crypto-seed), and comparing against decoded UR. Delivers value for developers learning the registry.

**Acceptance Scenarios**:

1. **Given** user opens registry browser, **When** page loads, **Then** system displays list of all registered types with tags, URType names, and CDDL summaries
2. **Given** a registered type (e.g., crypto-hdkey), **When** user clicks to expand, **Then** system shows full CDDL with syntax highlighting and link to official documentation
3. **Given** decoded UR with type, **When** user checks registry, **Then** system highlights matching registry entry or shows "unregistered type" message
4. **Given** multiple ur-registry packages (core, crypto, etc.), **When** browsing, **Then** system groups types by package with clear labels

---

### User Story 5 - Registry Item Interactive Console (Priority: P3)

Developers need to dynamically create and test registry items in the browser console to experiment with CBOR encoding/decoding and understand registry item behavior.

**Why this priority**: Advanced developer feature for testing custom registry types. Useful but not essential for most users.

**Independent Test**: Can be fully tested by creating a registry item via console API, encoding data, and seeing CBOR output. Delivers value for developers building custom registry items.

**Acceptance Scenarios**:

1. **Given** user decodes UR to JavaScript view, **When** output is displayed, **Then** system shows hint to open browser console with example commands (e.g., `window.registryPlayground.createItem(...)`)
2. **Given** developer opens console, **When** typing `window.registryPlayground`, **Then** autocomplete shows available methods (createItem, encode, decode, validate)
3. **Given** developer creates custom registry item in console, **When** instance is created, **Then** object auto-logs to console with expandable structure showing all properties and methods
4. **Given** custom registry item, **When** developer calls `.encode()`, **Then** system returns CBOR hex and displays in console for copy/paste
5. **Given** CBOR hex, **When** developer calls `window.registryPlayground.decode(hex)`, **Then** system returns JavaScript object with decoded structure

---

### Edge Cases

- What happens when user scans partially corrupted multi-part UR with some frames missing indefinitely?
  - System shows progress stuck at X%, displays which blocks are pending, allows manual reset
  
- What happens when user pastes extremely long hex input (>100KB)?
  - System shows warning about processing time, uses debouncing, provides cancel option

- What happens when camera access is revoked mid-scan?
  - System detects permission change, pauses scanning, shows re-grant instructions

- What happens when user switches browser tabs during animated QR generation?
  - Animation pauses (browser throttling), resumes on tab focus, no data loss

- What happens when decoded CBOR contains unknown/invalid registry type?
  - System displays "unknown type" with raw CBOR, offers manual type override option

- What happens when user tries to scan QR code in desktop browser (no camera)?
  - System detects no camera available, shows fallback message to use mobile or manual UR paste
- What happens when user sets repeatAfterRatio = 0 for generation?
  - System loops the animation infinitely, shows a streaming text preview that updates per part, disables exports, and prompts the user to choose a finite repeat value for downloads

## Requirements *(mandatory)*

### Functional Requirements

#### Format Conversion & Inspection (Tab 1)

- **FR-001**: System MUST detect input format automatically (multi-part UR, single UR, hex, bytewords) with priority: multi-part UR → single UR → hex → bytewords
- **FR-002**: System MUST convert between all supported formats: UR ↔ bytewords (minimal/standard/URI) ↔ hex ↔ decoded CBOR
- **FR-003**: System MUST assemble multi-part URs using fountain decoder with progress tracking (percentage complete based on decoded blocks / expected blocks)
- **FR-004**: System MUST display decoded CBOR in multiple views: JSON (default), Diagnostic notation, Commented, JavaScript object
- **FR-005**: System MUST validate UR type against ur-registry and show registration status (registered with link, or unregistered)
- **FR-006**: System MUST allow manual UR type override with pattern validation `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- **FR-007**: System MUST show pipeline visualization with directional arrows indicating conversion flow and stage status (success/error/inactive)
- **FR-008**: System MUST display conversion errors at specific pipeline stage with contextual messages (e.g., "Invalid hex: odd length" at hex parsing stage)
- **FR-009**: System MUST provide copy-to-clipboard for all output formats with visual confirmation
- **FR-010**: System MUST forward single UR output to Multi-UR Generator tab with "Send to Multi-UR Generator" button

#### Multi-Part UR Generation & Animated QR (Tab 2)

- **FR-011**: System MUST accept UR or hex input from converter tab or manual entry
- **FR-012**: System MUST expose all UrFountainEncoder parameters: max fragment length (10-200, default 100), min fragment length (5-50, default 10), first sequence number (default 0), repeat after ratio (0=infinite loop, N=repeat entire message N times after first complete send, default 2)
- **FR-013**: System MUST generate multi-part URs using fountain encoding with user-specified parameters
- **FR-014**: System MUST display generated parts based on repeatAfterRatio: (a) when > 0: scrollable text list with part numbers (1 of N, 2 of N, etc.) AND enable downloads; (b) when = 0: live streaming preview synchronized with animation, disable downloads, show guidance to pick finite repeat for export
- **FR-015**: System MUST render animated QR code on HTML canvas with configurable settings: size (200-800px, default 400), error correction (L/M/Q/H, default L), frame rate (1-30 fps, default 5)
- **FR-016**: System MUST use alphanumeric QR encoding mode optimized for bytewords
- **FR-016a** (Verification): Alphanumeric mode MUST be confirmed by: (1) checking qrcode@1.5.3 documentation for `options.mode` parameter, (2) testing with bytewords UR string, (3) comparing QR size with automatic mode (alphanumeric should produce smaller QR for bytewords)
- **FR-017**: System MUST provide animation controls: play/pause, restart, speed adjustment, and maintain continuous looping when repeatAfterRatio = 0
- **FR-018**: System MUST display current part indicator (e.g., "Part 3 of 15") overlaid on QR code
- **FR-019**: System MUST validate fountain encoder parameters before generation (min < max, valid ranges)
- **FR-020**: System MUST provide download options: multi-part UR text file, individual QR frames as PNG images (see FR-014 for repeatAfterRatio behavior)

#### QR Scanner & Fountain Decoder (Tab 3)

- **FR-021**: System MUST request camera permission on mobile browsers with clear permission prompt
- **FR-022**: System MUST display live camera preview with QR detection overlay when permission granted
- **FR-023**: System MUST auto-detect and decode QR codes in camera frame using real-time processing
- **FR-024**: System MUST use UrFountainDecoder to assemble multi-part URs with state tracking (seenBlocks, decodedBlocks)
- **FR-025**: System MUST display grid visualization showing decoded blocks (green) vs pending blocks (gray) based on UrFountainDecoder.decodedBlocks bitmap array
- **FR-026**: System MUST display progress: decoded blocks count, total expected blocks, percentage complete based on UrFountainDecoder.getProgress()
- **FR-027**: System MUST distinguish between seen blocks (scanned but not yet reduced to decoded) and decoded blocks (fully resolved original fragments)
- **FR-028**: System MUST detect UR type mismatch mid-scan (e.g., switching from crypto-seed to PSBT) and display warning with type names
- **FR-029**: System MUST provide manual reset button to clear fountain decoder state (UrFountainDecoder.reset()) and start new scan sequence
- **FR-030**: System MUST auto-forward assembled UR to converter tab when decoding reaches 100%
- **FR-031**: System MUST show troubleshooting tips if no QR detected after 10 seconds of scanning
- **FR-032**: System MUST handle camera permission denial with clear error message and re-grant instructions
- **FR-033**: System MUST detect absence of camera (desktop) and show fallback message to use mobile or manual paste

#### Registry Browser & Type Inspection (Tab 4)

- **FR-034**: System MUST display list of all registered UR types from ur-registry packages (tag number, URType name, short description)
- **FR-035**: System MUST group registry types by package (core, crypto, etc.) with collapsible sections
- **FR-036**: System MUST display full CDDL schema for each type in expandable view with syntax highlighting
- **FR-037**: System MUST provide links to official documentation for each registered type (when available)
- **FR-038**: System MUST highlight matching registry entry when user decodes UR with registered type
- **FR-039**: System MUST show "unregistered type" indicator for URs with types not in registry

#### Registry Item Interactive Console (Tab 4)

- **FR-040**: System MUST expose `window.registryPlayground` object with methods: createItem, encode, decode, validate
- **FR-041**: System MUST display console hint when user views decoded JavaScript output with example commands
- **FR-042**: System MUST auto-log created registry item instances to console with expandable structure
- **FR-043**: System MUST provide encode method that returns CBOR hex from registry item instance
- **FR-044**: System MUST provide decode method that parses CBOR hex to JavaScript object
- **FR-045**: System MUST preserve all console functionality (errors, logs, warnings) for developer debugging

#### Cross-Cutting Requirements

- **FR-046**: System MUST work in mobile browsers (Chrome/Firefox mobile) with touch-optimized controls
- **FR-047**: System MUST use hash-based routing for tabs (#converter, #multi-ur, #scanner, #registry)
- **FR-048**: System MUST forward data between tabs via URL parameters and temporary session storage (TTL: 1 hour, cleared on page unload via beforeunload event, max payload: 5MB per constitution privacy guard)
- **FR-049**: System MUST debounce user inputs (typing: 150ms, paste: 10ms) to optimize performance
- **FR-050**: System MUST cache conversion results (key: rawInput|format|outputFormat|urType|styles, max 120 items, LRU eviction)
- **FR-051**: System MUST use bc-ur library methods exclusively (never reimplement encoding pipelines)
- **FR-052**: System MUST pin library version in production (@ngraveio/bc-ur@2.0.0-beta.9 via CDN)

### Key Entities

- **UR (Uniform Resource)**: Encoded data representation following BC-UR standard. Attributes: type (string), payload (CBOR), checksum. Can be single-part or multi-part fountain-encoded.

- **Multi-Part UR**: Sequence of fountain-encoded UR fragments. Attributes: sequence number, total sequence length, message length, checksum, fragment data. Assembled via UrFountainDecoder.

- **Decoded Block**: Original data fragment extracted from multi-part UR via fountain decoding. Tracked in decodedBlocks bitmap (1=decoded, 0=pending). Distinct from seen blocks (mixed fragments not yet reduced).

- **Registry Type**: Registered UR type definition from ur-registry. Attributes: tag number (CBOR tag), URType string (kebab-case), CDDL schema, documentation link, package name.

- **Registry Item**: Instance of registered type created dynamically. Attributes: type reference, encoded CBOR data, decoded JavaScript representation, validation status.

- **QR Code Frame**: Single frame in animated multi-part QR sequence. Attributes: part number, UR string, QR size, error correction level, encoding mode (alphanumeric).

- **Fountain Decoder State**: UrFountainDecoder instance tracking multi-part UR assembly. Attributes: seenBlocks bitmap (scanned fragments), decodedBlocks bitmap (resolved original blocks), progress percentage, expected block count, checksum.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can convert between any two formats (UR/hex/bytewords/CBOR) in under 500ms for inputs up to 10KB
- **SC-002**: Users can scan and decode 15-frame animated QR code in under 30 seconds total (including camera setup ~10s, frame scanning ~3s at 5fps, fountain decoding ~5s, multiple loop passes for redundancy)
- **SC-003**: 95% of users successfully complete format conversion on first attempt without errors
- **SC-004**: Developers can browse all registered types and view CDDL schemas within 3 clicks
- **SC-005**: System correctly assembles multi-part URs with 100% accuracy when all blocks are received
- **SC-006**: Mobile users can grant camera permission and start scanning within 10 seconds of opening scanner tab
- **SC-007**: System displays helpful error messages that allow 90% of users to self-recover from common mistakes (invalid hex, wrong UR type, etc.)
- **SC-008**: Animated QR generation completes within 2 seconds for URs generating up to 50 parts
- **SC-009**: Console playground examples allow developers to create and encode custom registry items within 5 minutes of first use
- **SC-010**: System serves as source of truth for bc-ur library behavior, matching reference implementation in 100% of test cases

## Dependencies & Assumptions *(optional)*

### External Dependencies

- **bc-ur library** (`@ngraveio/bc-ur@2.0.0-beta.9`): Core encoding/decoding functionality (UR.pipeline, BytewordEncoding, UrFountainEncoder, UrFountainDecoder)
- **ur-registry packages**: Registry type definitions (tags, CDDL schemas, factory methods)
  - `@ngraveio/ur-blockchain-commons` - Types defined by BlockChain Commons
  - `@ngraveio/ur-coin-identity` - Implementation of coin-identity type that can uniquely represent a coin
  - `@ngraveio/ur-sync` - Implementations of following types: detailed-account, portfolio-coin, portfolio-metadata, portfolio
  - `@ngraveio/ur-hex-string` - Implementation of hex-string type that encodes and decodes hex string
  - `@ngraveio/ur-sign` - Implementation of sign request and response protocols for various blockchains
  - `@ngraveio/ur-uuid` - UUID type implementation
  - Additional packages as listed in reference_projects/ur-registry/README.md
- **QR generation library**: `qrcode@1.5.3` - Canvas-based generation with alphanumeric mode support, error correction levels (L/M/Q/H)
- **QR scanner library**: `qr-scanner@1.4.2` - Real-time camera frame processing with Web Worker support (mobile-optimized)
- **CBOR decoder**: For diagnostic notation and commented views (cbor2 or equivalent)

### Assumptions

- **Browser Support**: Target Chrome 90+, Firefox 88+ (desktop + mobile). Safari 14+ supported but not primary.
- **Camera Access**: Mobile browsers support MediaDevices API with camera permissions. Desktop may not have camera (fallback to manual paste).
- **ESM Modules**: All libraries available as ES modules via CDN (esm.sh) or local packages
- **No Build Step**: Pure ESM, no transpilation, direct file deployment (index.html + demo.js)
- **Development vs Production**: Development uses local yarn packages, production uses pinned CDN imports
- **Reference Projects**: `reference_projects/bc-ur`, `reference_projects/ur-registry`, `reference_projects/animated-QR-tool` are authoritative for API usage patterns
- **No Persistent Storage**: Except temporary sessionStorage for cross-tab forwarding (cleared on page unload)
- **Privacy-First**: No analytics, no tracking by default (can be added if justified and documented)
- **Mobile-First**: Touch-optimized controls, responsive design, camera-centric UX for scanning

## Out of Scope *(optional)*

### Explicitly Excluded Features

- **Sensitive Data Detection**: No automatic detection/warnings for private keys, mnemonics, or seed phrases. Users/developers decide what is sensitive.
- **Image/Video Upload**: No file upload for QR scanning. Scanner uses live camera only (mobile focus).
- **Performance Budget Enforcement**: No hard performance limits or quotas. Optimization handled via debouncing and caching.
- **Wallet Functionality**: No key generation, signing, encryption, or blockchain interactions
- **Data Persistence**: No localStorage, IndexedDB, or server storage of UR data
- **Server-Side Processing**: No backend API calls, all processing client-side
- **Batch Processing**: No bulk conversion of multiple URs simultaneously
- **Export Formats**: No PDF, CSV, or other export formats beyond text and images

### Future Enhancements (Not in MVP)

#### High-Priority Post-MVP

- **CDDL Validation & Editor**:
  - Full CDDL editor with syntax highlighting for creating custom registry types
  - Automatic CDDL validation when decoding URs (real-time)
  - Validation against all CDDL types: registered types (from ur-registry schemas) and custom user-provided schemas
  - Inline error highlighting in decoded CBOR output (mismatched fields highlighted)
  - Summary validation panel showing all errors with line numbers and expected vs actual values
  - Custom type creation workflow: write CDDL → validate → test encode/decode → register to window.registryPlayground

#### Medium-Priority Post-MVP

- Animated GIF export from QR frames
- Shareable links with URL-encoded state
- Dark mode toggle
- Test vector generator
- Performance profiler dashboard

## Notes & Rationale *(optional)*

### Design Decisions

**Why mobile-first?**  
Camera access is easier on mobile devices. Primary use case is scanning wallet QR codes with phone camera. Desktop users can still use converter and generator, but scanning requires mobile.

**Why separate tabs instead of single page?**  
Each workflow (convert, generate, scan, inspect) is distinct. Tabs reduce cognitive load, enable lazy loading, and allow focused UX per workflow.

**Why fountain decoder grid shows decoded blocks vs seen blocks?**  
UrFountainDecoder tracks two states: seenBlocks (mixed fragments scanned) and decodedBlocks (original blocks resolved via XOR reduction). Users care about progress toward completion, which is decodedBlocks. Seen blocks can be infinite with fountain codes, decoded blocks are fixed count.

**Why console playground instead of built-in registry item creator?**  
Developers already familiar with browser DevTools. Building duplicate console UI adds complexity. Exposing window.registryPlayground with hints is simpler, more flexible, and follows developer expectations.

**Why no sensitive data warnings?**  
Users inspecting wallet URs already know what's sensitive. False positives/negatives create confusion. Tool's role is to decode and display, user decides what's private.

**Why source of truth emphasis?**  
BC-UR.me aims to be the reference implementation for debugging library issues. When developers encounter encoding problems, they should be able to verify behavior against this tool. 100% library method usage (no reimplementation) ensures accuracy.

**Why is CDDL validation a future enhancement instead of MVP?**  
CDDL validation adds significant complexity (parser, editor, syntax highlighting, validation engine). MVP focuses on core workflows: convert, scan, inspect. CDDL validation enhances the registry playground but isn't essential for primary use cases (understanding what's in URs, testing wallet QR codes). Post-MVP implementation allows focus on getting core functionality right first, then adding advanced developer tools.

**Why automatic validation instead of on-demand?**  
Real-time validation provides immediate feedback when decoding URs. Developers don't need to remember to click "Validate" - they see schema compliance status instantly. Inline highlighting (mismatched fields) + summary panel (all errors) gives both quick visual feedback and detailed diagnostics. Performance impact mitigated by debouncing and caching validation results.

### Technical Constraints

- **Browser APIs**: Requires modern browser with ES modules, Clipboard API, MediaDevices API (camera), CSS Grid
- **HTTPS Required**: Camera access requires secure context (HTTPS or localhost)
- **No iOS Safari Camera Constraints**: iOS Safari may have camera API limitations (requires testing)
- **QR Library Selection**: Must support alphanumeric mode explicitly (not all libraries do)
- **Registry Package Size**: All ur-registry packages add up to significant bundle size (consider lazy loading)

### Open Questions

None - all critical decisions resolved via user clarifications (Q1-A: single comprehensive spec, Q2-C: console hints, Q3-C: decoded blocks grid).
