# Feature Specification: BC-UR Playground with Multi-Format Conversion and QR Code Support

**Feature Branch**: `001-focus-of-this`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "Focus of this project is to allow (mostly) developers and users to have a playground with bc-ur library and animated qr codes, See what is contained in the qr codes and multi-urs, check if the type is in the ur-registry be able to debug decoded cbor content. Live play with Registry Items on console and check what is it capable of. If there is an error in their implementation be the source of truth for those libraries. It should also work in mobile browsers because its easier to access camera on you phone for decoding animated qr codes that are composed of multi-part UR code. Also to understand what data is encoded on their wallet that uses urs and make sure their wallet is not sending their mnemonic or private keys etc. Basically online implementation of https://github.com/blockchaincommons/URDemo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Format Conversion and Inspection (Priority: P1)

A developer receives a UR-encoded string from a cryptocurrency wallet and wants to understand what data it contains. They paste the UR into the playground, see it automatically decoded into multiple formats (hex, bytewords, CBOR), inspect the registry type to verify it's a legitimate data structure, and examine the decoded JavaScript object in the browser console.

**Why this priority**: Core value proposition - enables users to inspect and validate UR-encoded data for security and debugging. This is the primary use case that delivers immediate value.

**Independent Test**: Can be fully tested by pasting a UR string and verifying all format conversions are displayed correctly. Delivers value even without QR code features.

**Acceptance Scenarios**:

1. **Given** a single-part UR string, **When** user pastes it into the input field, **Then** the system displays decoded hex, bytewords, CBOR diagnostic notation, and identifies the registry type
2. **Given** a multi-part UR string (fountain-encoded), **When** user pastes all parts, **Then** the system assembles the complete UR and displays the decoded data
3. **Given** decoded CBOR content, **When** user selects "JavaScript" output format, **Then** the system makes the decoded object available in browser console for inspection
4. **Given** a UR with unknown registry type, **When** decoded, **Then** system displays the CBOR structure and indicates the type is not in the standard registry
5. **Given** any valid format (hex, bytewords, or UR), **When** user enters it, **Then** system auto-detects the format and converts to all other formats

---

### User Story 2 - QR Code Scanning on Mobile (Priority: P2)

A user wants to verify what data their hardware wallet is transmitting via animated QR codes. They open the playground on their mobile phone, grant camera access, scan the animated QR sequence from their wallet's screen, and see a grid showing which parts have been received and decoded. The system assembles the complete data and displays all format conversions.

**Why this priority**: Critical for mobile security verification use case. Mobile cameras make QR scanning practical, and users need to understand what data is being transmitted.

**Independent Test**: Can be tested by opening the app on a mobile device, scanning a multi-part UR QR sequence, and verifying successful decode with all data visible. Works independently of format conversion features.

**Acceptance Scenarios**:

1. **Given** user is on a mobile device, **When** they tap "Scan QR Code", **Then** browser requests camera permission and displays live camera feed
2. **Given** camera is active and scanning, **When** animated QR codes are displayed to camera, **Then** system detects UR type and shows a grid of original parts with status (decoded/seen/pending)
3. **Given** QR scanning is in progress, **When** user moves camera to a different UR sequence with different type, **Then** system displays warning that type has changed (e.g., from crypto-seed to crypto-psbt)
4. **Given** scanning shows type mismatch, **When** user wants to start over, **Then** user can reset the fountain decoder state to begin scanning a new UR
5. **Given** all QR parts are scanned, **When** fountain decoder completes, **Then** system displays the assembled UR and all decoded formats
6. **Given** scanning is in progress, **When** user receives partial data, **Then** grid displays which specific part numbers are decoded vs only seen vs still pending

---

### User Story 3 - Multi-Part UR Generation with Animated QR (Priority: P3)

A developer needs to test their wallet's QR scanning functionality. They enter test data (like a PSBT or crypto-seed), configure the multi-part UR settings (fragment size, QR version), and the playground generates an animated QR code sequence that they can display to their wallet's camera for testing.

**Why this priority**: Enables developers to create test data for wallet QR scanning features. Less critical than inspection/scanning but valuable for development workflows.

**Independent Test**: Can be tested by entering data, generating animated QR codes, and verifying the animation displays correctly. Complete feature requires scanning capability but generation can work standalone.

**Acceptance Scenarios**:

1. **Given** user enters data in any format, **When** they select "Generate QR Codes", **Then** system converts to UR format and displays configuration options (fragment size, frame rate)
2. **Given** data size exceeds single QR capacity, **When** generation starts, **Then** system creates multi-part fountain-encoded sequence and displays part count
3. **Given** multi-part QR sequence is generated, **When** animation plays, **Then** each QR part cycles at user-configured interval with part number visible
4. **Given** animated QR is playing, **When** user adjusts frame rate, **Then** animation speed updates in real-time
5. **Given** QR codes are displayed, **When** user hovers/taps individual frames, **Then** system shows that specific part's raw UR string

---

### User Story 4 - Console API for Registry Experimentation (Priority: P4)

An advanced developer wants to test registry item creation and encoding. They open the browser console, use exposed API functions to create registry items (like `CryptoSeed`, `CryptoPSBT`), experiment with encoding parameters, and immediately see the results in the playground UI without writing separate code. When decoding to JavaScript format, the object is automatically available in the console for deep inspection.

**Why this priority**: Developer power-user feature that enables advanced experimentation. Lower priority as it serves a smaller, technical audience.

**Independent Test**: Can be tested by opening console, calling exposed API functions (e.g., `playground.createSeed({...})`), and verifying the result updates the UI. Works independently but enhanced by other features.

**Acceptance Scenarios**:

1. **Given** user opens browser console, **When** they access the global playground object, **Then** documentation shows available registry item constructors and encoding functions
2. **Given** user creates a registry item via console, **When** they call `.encode()`, **Then** the playground UI updates with the UR, hex, and bytewords outputs
3. **Given** user decodes to JavaScript format, **When** conversion completes, **Then** the JavaScript object is accessible via a global console variable (e.g., `window.decodedObject`)
4. **Given** user experiments with different encoding options, **When** they modify parameters, **Then** changes are reflected in real-time in the UI
5. **Given** user creates invalid registry data, **When** encoding fails, **Then** console displays detailed error with reference to registry specification
6. **Given** user tests unknown registry types, **When** they provide custom CBOR tags, **Then** system encodes the data and marks the type as non-standard

---

### User Story 5 - Custom Registry Type Definition via UI (Priority: P5)

A developer working with experimental blockchain protocols needs to define a custom registry type not in the standard specification. They use the playground UI to define the CBOR structure, tag number, and encoding rules, then test encoding/decoding data with this custom type to validate their specification before implementing it in their application.

**Why this priority**: Enables extension beyond standard registry types but serves niche use case of protocol developers. Lower priority than core conversion features.

**Independent Test**: Can be tested by creating a custom type definition, encoding data with it, and verifying the custom type is recognized in subsequent conversions. Requires UI for type definition separate from console API.

**Acceptance Scenarios**:

1. **Given** user selects "Define Custom Type", **When** they enter type name and CBOR tag, **Then** system validates uniqueness and tag number range
2. **Given** custom type is defined, **When** user specifies CBOR structure schema, **Then** system validates schema syntax and stores definition for session
3. **Given** custom type exists, **When** user encodes data matching that type, **Then** system uses custom type in UR encoding and displays custom type name
4. **Given** custom type is being used, **When** user decodes UR with that type, **Then** system recognizes custom type and validates against defined schema
5. **Given** multiple custom types are defined, **When** user exports definitions, **Then** system provides JSON schema export for use in other tools

---

### User Story 6 - Batch Processing of Multiple URs (Priority: P6)

A developer has a log file containing dozens of UR-encoded transactions and wants to decode them all at once. They paste or upload the batch of URs, and the system processes each one, displaying a summary table showing registry type, size, and key data fields for each UR with the ability to drill down into individual items.

**Why this priority**: Productivity feature for developers working with large datasets. Lower priority as single-item inspection covers majority of use cases.

**Independent Test**: Can be tested by providing multiple UR strings (newline or comma separated), verifying all are decoded, and confirming summary view displays correctly. Builds on single-item conversion features.

**Acceptance Scenarios**:

1. **Given** user pastes multiple UR strings (newline separated), **When** input is detected as batch, **Then** system displays count of URs and batch processing indicator
2. **Given** batch processing starts, **When** each UR is decoded, **Then** system displays progress (e.g., "Processing 15/47")
3. **Given** batch is complete, **When** results are ready, **Then** system shows table with columns: index, type, size, status (success/error), preview
4. **Given** summary table is displayed, **When** user clicks a row, **Then** system expands that UR showing full decoded formats
5. **Given** batch contains errors, **When** some URs fail to decode, **Then** error rows are highlighted with specific error messages
6. **Given** batch results are displayed, **When** user exports, **Then** system provides CSV or JSON export of all decoded data

---

### User Story 7 - Reference Implementation Validation (Priority: P7)

A wallet developer suspects their bc-ur library integration has a bug. They use the playground as the source of truth by encoding the same data in both systems, comparing outputs byte-by-byte, and identifying where their implementation diverges from the reference bc-ur library.

**Why this priority**: Positions playground as authoritative reference but relies on other features being complete. Lower priority as it's a consequence of accurate implementation rather than a distinct feature.

**Independent Test**: Can be tested by encoding identical data in both the playground and external implementation, then comparing outputs. Requires format conversion features to be working correctly.

**Acceptance Scenarios**:

1. **Given** user has data from external implementation, **When** they encode same data in playground, **Then** both hex outputs match exactly or playground highlights differences
2. **Given** multi-part UR assembly differs between systems, **When** user inputs both sequences, **Then** playground shows which parts differ and why (ordering, fountain encoding parameters)
3. **Given** bytewords encoding differs, **When** user compares outputs, **Then** playground indicates if difference is due to style (minimal vs standard) or actual encoding error
4. **Given** CBOR structure differs, **When** decoded, **Then** playground displays side-by-side comparison highlighting structural differences
5. **Given** registry type detection differs, **When** user inspects data, **Then** playground explains which CBOR tags are present and how they map to registry types

---

### Edge Cases

- **What happens when QR codes are scanned out of sequence?** System uses fountain decoder which handles parts in any order, grid displays which parts have been received
- **What happens when camera access is denied?** System displays error message explaining camera is required for QR scanning and prompts user to grant permission or use manual text input
- **What happens when scanning partial QR sequence (e.g., only 5 of 10 parts)?** Grid shows decoded/seen status for each part; user can continue scanning or reset to start new sequence
- **What happens when input is invalid/corrupted?** System displays specific error (e.g., "Invalid UR format: checksum mismatch at position 47") with suggestions
- **What happens when decoded data contains large binary blobs?** System provides expandable sections with byte length indicators and truncated preview
- **What happens when mobile browser doesn't support camera API?** System detects capability and shows error message indicating QR scanning is unavailable; user can still use text input
- **What happens when UR type claims to be in registry but structure doesn't match?** System displays validation error with expected vs actual CBOR structure
- **What happens with extremely large multi-part URs (100+ parts)?** System displays grid with all part slots; may show scrollable view if grid exceeds screen size
- **What happens when user scans QR codes from multiple different URs?** System detects sequence ID or type change and displays warning prompting user to reset before continuing
- **What happens when scanning same parts repeatedly?** Grid shows part as already decoded; fountain decoder ignores duplicate parts
- **What happens when batch processing encounters mixed valid/invalid URs?** System processes all items, displays success count and error count, with table showing per-item status
- **What happens when custom type definition conflicts with standard registry type?** System prevents saving custom type with warning about namespace collision
- **What happens when custom type CBOR tag collides with existing tag?** System warns user and suggests alternative tag numbers from available ranges

## Requirements *(mandatory)*

### Functional Requirements

#### Format Conversion & Detection

- **FR-001**: System MUST automatically detect input format (multi-part UR, single UR, hex, bytewords, CBOR) without user selection
- **FR-002**: System MUST convert between all supported formats bidirectionally (UR ↔ hex ↔ bytewords ↔ CBOR)
- **FR-003**: System MUST support bytewords in all three styles: minimal (2-char), standard (4-letter), and URI-safe
- **FR-004**: System MUST display CBOR in multiple representations: JSON, diagnostic notation, commented structure, and JavaScript object
- **FR-005**: System MUST validate format integrity (checksums for UR, even-length for hex, valid CBOR structure)

#### Multi-Part UR Assembly

- **FR-006**: System MUST decode fountain-encoded multi-part URs using the bc-ur library's `UrFountainDecoder`
- **FR-007**: System MUST display grid showing all original UR parts with status indicators (decoded, seen, pending)
- **FR-008**: System MUST accept multi-part UR fragments in any order and track which parts have been received
- **FR-009**: System MUST indicate when multi-part assembly is complete and display the reconstructed UR
- **FR-010**: System MUST allow manual entry of individual UR parts with validation per part
- **FR-011**: System MUST allow user to reset fountain decoder state to clear current progress and start scanning new UR

#### Registry Type Detection & Validation

- **FR-012**: System MUST identify UR registry types from CBOR tags and display the type name (e.g., `crypto-seed`, `crypto-psbt`)
- **FR-013**: System MUST indicate when a UR type is not in the standard ur-registry specification
- **FR-014**: System MUST validate CBOR structure against expected registry schema when type is known
- **FR-015**: System MUST display registry type metadata (description, specification reference) when available
- **FR-016**: System MUST show raw CBOR tag numbers for unknown or custom registry types
- **FR-017**: System MUST support all registry types from ur-registry monorepo packages (blockchain-commons, coin-identity, sync types, hex-string, sign, uuid)

#### Console Integration for JavaScript Objects

- **FR-018**: System MUST expose decoded JavaScript objects to browser console when user selects JavaScript output format
- **FR-019**: System MUST make decoded object accessible via global variable (e.g., `window.decodedObject` or `playground.lastDecoded`)
- **FR-020**: System MUST preserve object structure for console inspection (nested objects, arrays, typed data)
- **FR-021**: System MUST update console variable when new conversions are performed

#### QR Code Scanning (Mobile & Desktop)

- **FR-022**: System MUST request camera access and display live camera feed for QR scanning on supported browsers
- **FR-023**: System MUST decode animated QR sequences displaying multi-part URs with fountain encoding
- **FR-024**: System MUST detect UR type from first scanned part and display type information
- **FR-025**: System MUST detect when scanned QR code changes to different UR type during scanning session
- **FR-026**: System MUST warn user when UR type changes mid-scan (e.g., from crypto-seed to crypto-psbt)
- **FR-027**: System MUST provide reset button to clear fountain decoder state and begin scanning new UR sequence
- **FR-028**: System MUST display grid visualization of original parts showing decoded/seen/pending status
- **FR-029**: System MUST distinguish between "seen" parts (detected but not yet decoded) and "decoded" parts (fully processed)
- **FR-030**: System MUST work on mobile browsers (iOS Safari, Android Chrome) with responsive touch-friendly UI
- **FR-031**: System MUST handle QR scanning errors (unreadable codes, corrupted data) with specific error messages

#### QR Code Generation

- **FR-032**: System MUST generate single QR codes for data that fits within capacity limits
- **FR-033**: System MUST generate multi-part fountain-encoded QR sequences for large data using bc-ur library's `UrFountainEncoder`
- **FR-034**: System MUST display animated QR sequences with user-configurable frame rate (frames per second)
- **FR-035**: System MUST allow configuration of QR parameters (fragment size, error correction level, QR version)
- **FR-036**: System MUST display individual QR parts on hover/tap with part number and raw UR string
- **FR-037**: System MUST show total part count and estimated scan time based on frame rate

#### Console API for Developer Experimentation

- **FR-038**: System MUST expose global JavaScript API for creating registry items (e.g., `playground.createSeed()`)
- **FR-039**: System MUST provide console functions for encoding/decoding operations that update the UI
- **FR-040**: System MUST display API documentation in console when global object is accessed
- **FR-041**: System MUST validate console API inputs and return detailed error messages referencing registry specs
- **FR-042**: System MUST allow creation of custom/experimental registry types via console API

#### Custom Registry Type Definition

- **FR-043**: System MUST provide UI for defining custom registry types with type name, CBOR tag, and structure schema
- **FR-044**: System MUST validate custom type definitions (unique names, valid tag numbers, correct CBOR schema syntax)
- **FR-045**: System MUST prevent custom types from conflicting with standard registry type names or tags
- **FR-046**: System MUST store custom type definitions for current session and allow export as JSON schema
- **FR-047**: System MUST recognize and use custom types when encoding/decoding URs during the session
- **FR-048**: System MUST validate data against custom type schemas and display schema validation errors

#### Batch Processing

- **FR-049**: System MUST accept multiple UR inputs (newline, comma, or space separated) and detect batch mode automatically
- **FR-050**: System MUST process batches of URs and display progress indicator during processing
- **FR-051**: System MUST display summary table showing all batch items with columns for index, type, size, status, and preview
- **FR-052**: System MUST allow expanding individual items from batch summary to view full decoded formats
- **FR-053**: System MUST handle mixed success/error results in batch processing and highlight errors in summary
- **FR-054**: System MUST provide export functionality for batch results (CSV or JSON format)

#### User Experience & Interface

- **FR-055**: System MUST provide copy-to-clipboard functionality for all output formats
- **FR-056**: System MUST display visual feedback for successful/failed operations (color coding, icons, animations)
- **FR-057**: System MUST show pipeline visualization indicating conversion flow direction (forward/reverse)
- **FR-058**: System MUST provide example inputs for each supported format to help users get started
- **FR-059**: System MUST cache conversion results for performance (prevent re-computation of identical inputs)
- **FR-060**: System MUST debounce input processing to avoid excessive computation during typing
- **FR-061**: System MUST display clear, actionable error messages with specific failure reasons (not generic errors)

### Non-Functional Requirements

- **NFR-001**: System MUST load and execute entirely in browser without backend dependencies
- **NFR-002**: System MUST support modern mobile browsers (iOS Safari 14+, Android Chrome 90+)
- **NFR-003**: System MUST respond to input changes within reasonable time for typical conversion operations
- **NFR-004**: System MUST handle multi-part URs with up to 200 fragments without performance degradation
- **NFR-005**: System MUST be accessible via public URL without authentication or registration
- **NFR-006**: System MUST use pinned bc-ur library version to ensure consistent behavior as reference implementation
- **NFR-007**: System MUST provide visual accessibility (sufficient contrast, readable fonts on mobile)
- **NFR-008**: System MUST not persist data beyond current session except for custom type definitions in sessionStorage

### Key Entities *(include if feature involves data)*

- **UR (Uniform Resource)**: Encoded data representation following BC-UR specification, contains type identifier and CBOR-encoded payload
- **Multi-part UR Fragment**: Individual fountain-encoded piece of a larger UR, contains sequence ID and part index
- **Part Grid Cell**: Visual representation of a single UR part showing status (decoded/seen/pending) and part number
- **Registry Item**: Structured data type from ur-registry specification (e.g., CryptoSeed, CryptoPSBT, CryptoHDKey, CoinIdentity, etc.)
- **Custom Registry Type**: User-defined registry type with custom CBOR tag and schema validation rules
- **CBOR Structure**: Binary data format used internally by UR encoding, contains tags and nested data structures
- **Bytewords Encoding**: Human-readable word encoding of binary data, available in three styles (minimal/standard/URI)
- **QR Code Frame**: Individual QR code image in an animated sequence, contains one UR fragment
- **Conversion Pipeline Stage**: Individual step in format transformation (e.g., UR → CBOR → hex)
- **Fountain Decoder State**: Current status of multi-part UR assembly including received parts and completion progress
- **Batch Item**: Single UR entry in a batch processing operation with individual status and results

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can paste a UR string and see all decoded formats (hex, bytewords, CBOR) displayed within 1 second
- **SC-002**: Users can scan a 10-part animated QR sequence on mobile device and see grid update in real-time as parts are received
- **SC-003**: System correctly identifies registry types for 100% of standard ur-registry items from all monorepo packages
- **SC-004**: System works on mobile browsers with responsive UI that requires no pinch-zoom for readability
- **SC-005**: Users can generate animated QR codes from any input format and configure frame rate between 1-10 FPS
- **SC-006**: Console API enables developers to create and encode registry items in under 5 lines of code with real-time UI updates
- **SC-007**: Decoded JavaScript objects are accessible in browser console for inspection immediately after conversion
- **SC-008**: 90% of format conversions complete without user needing to manually specify input format (auto-detection success rate)
- **SC-009**: System processes multi-part URs with 50+ fragments without user-perceivable delays
- **SC-010**: Grid visualization clearly shows status of all UR parts with color coding or icons distinguishing decoded/seen/pending states
- **SC-011**: Users scanning QR codes receive immediate visual warning when UR type changes mid-scan
- **SC-012**: Users can reset fountain decoder state and start new scan within 1 click/tap
- **SC-013**: Error messages for invalid inputs include specific problem description and suggested fixes (e.g., "Invalid hex: odd length" vs generic "Invalid input")
- **SC-014**: Developers can validate their bc-ur implementation by comparing outputs with playground results showing byte-exact matches or specific differences
- **SC-015**: Users can define a custom registry type and successfully encode/decode data with it within 2 minutes
- **SC-016**: Batch processing of 50 URs completes with summary table displayed within 5 seconds
- **SC-017**: Users can export batch processing results in CSV or JSON format with one click
- **SC-018**: Custom type definitions prevent namespace collisions with standard registry types 100% of the time

## Assumptions

1. **Browser Capabilities**: Target users have modern browsers with ES6 module support, Web Crypto API, and Clipboard API
2. **Camera Access**: Mobile users will grant camera permissions when prompted for QR scanning; users without camera can use manual text input
3. **Network Access**: Users have internet connection for initial load to fetch bc-ur and ur-registry libraries from CDN (no offline mode required)
4. **Data Size Limits**: Typical use cases involve URs under 10KB; extremely large data (>100KB) may have degraded performance; batch processing typically under 100 items
5. **Registry Coverage**: System uses current ur-registry monorepo packages; new/custom types will be marked as unknown but still decoded
6. **Security Model**: Users understand this is a development/inspection tool and will make their own decisions about data sensitivity
7. **Reference Truth**: bc-ur library version 2.0.0-beta.9 from @ngraveio/bc-ur is considered authoritative for encoding/decoding behavior
8. **QR Code Standards**: Animated QR sequences follow BC-UR fountain encoding specification with default parameters
9. **Mobile Performance**: Mobile devices from last 3 years have sufficient processing power for real-time QR scanning
10. **Privacy Expectation**: Users accept client-side processing model and understand no data leaves their device
11. **Console Access**: Developer users know how to open browser developer console for API experimentation
12. **QR Library**: Standard JavaScript QR libraries (qrcode.js for generation, jsQR for scanning) provide sufficient functionality
13. **Custom Type Usage**: Custom registry types are for experimental/development purposes and not expected to be standardized
14. **Batch Input Format**: Batch URs are provided as text with standard delimiters (newline, comma, space); no complex file parsing needed
15. **Session Persistence**: Custom type definitions persist only for current browser session; users understand they need to export for reuse

## Out of Scope

1. **Persistent Data Storage**: No user accounts or saved conversion history across browser sessions (only sessionStorage for custom types)
2. **Wallet Functionality**: No key generation, transaction signing, or blockchain interaction
3. **Backend Services**: No server-side processing, database, or API endpoints
4. **Offline Mode**: No service worker or offline-first functionality (CDN dependency required)
5. **Advanced Diff Tools**: No visual diff/comparison view for side-by-side UR comparison (manual inspection only)
6. **Internationalization**: English-only UI and error messages
7. **Accessibility Standards**: No WCAG 2.1 AA compliance (basic readability only)
8. **Image/Video Upload**: No file upload for QR scanning; camera-only for QR detection
9. **Automated Testing Suite**: No built-in test runner for validating custom registry types
10. **Cloud Sync**: No synchronization of custom types or settings across devices
11. **Collaborative Features**: No sharing of playground state or custom types with other users
12. **Advanced Batch Operations**: No filtering, sorting, or search within batch results beyond basic table display

## Dependencies

### Core Libraries
1. **bc-ur Library**: `@ngraveio/bc-ur@2.0.0-beta.9` from esm.sh CDN for all encoding/decoding operations
2. **QR Code Generation**: qrcode.js or similar library for creating QR code images
3. **QR Code Scanning**: jsQR or similar library for decoding QR codes from camera feed

### Registry Type Libraries (from ur-registry monorepo)
4. **@ngraveio/ur-blockchain-commons**: Types defined by BlockChain Commons
5. **@ngraveio/ur-coin-identity**: Coin identity type for unique coin representation
6. **@ngraveio/ur-sync**: Multi-layer sync types (detailed-account, portfolio-coin, portfolio-metadata, portfolio)
7. **@ngraveio/ur-hex-string**: Hex string encoding/decoding type
8. **@ngraveio/ur-sign**: Sign request and response protocols for various blockchains
9. **@ngraveio/ur-uuid**: Universally unique identifiers type

### Browser APIs
10. **Camera API**: getUserMedia for QR code scanning
11. **Clipboard API**: For copy-to-clipboard functionality
12. **Web Crypto API**: For CBOR operations and cryptographic data handling
13. **SessionStorage API**: For persisting custom type definitions during browser session

### Browser Support
14. **Mobile Browsers**: iOS Safari 14+ and Android Chrome 90+ for camera access and ES6 modules

## Constraints

1. **Client-Side Only**: All processing must occur in browser; no backend server or database allowed
2. **Library Trust**: Must use bc-ur library methods exactly as documented; no custom encoding implementations
3. **CDN Dependency**: Requires internet connection to load bc-ur and ur-registry libraries from esm.sh (no bundled fallback)
4. **Mobile Compatibility**: UI must be fully functional on touch devices without desktop-specific interactions
5. **Security Boundary**: System does not identify or warn about sensitive data; users make their own security decisions
6. **Browser Compatibility**: Limited to modern browsers; no IE11 or legacy browser support
7. **Registry Versioning**: Locked to specific ur-registry package versions; changes require manual library update
8. **Camera Requirement**: QR scanning requires camera access; no fallback image upload option
9. **Real-Time Processing**: Grid updates and type detection must happen during live camera scanning without manual triggers
10. **Session-Only Custom Types**: Custom registry type definitions are not persisted across browser sessions (export required)
11. **Batch Size Limits**: Batch processing optimized for typical use cases (under 100 items); larger batches may have performance impact
12. **Schema Validation Complexity**: Custom type schema validation limited to basic CBOR structure checks, not full semantic validation

## Clarifications Needed

None - all requirements have been clarified based on user feedback.

## Open Questions

None at this time - all major scope and technical decisions have been addressed.
