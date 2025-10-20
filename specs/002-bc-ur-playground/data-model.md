# Data Model: BC-UR Playground

**Feature**: BC-UR Playground | **Phase**: 1 (Design & Contracts) | **Date**: 2025-10-08

## Overview

This document defines the core entities, state structures, and validation rules for BC-UR Playground. All models are client-side JavaScript objects (no database schemas). State is ephemeral (in-memory or sessionStorage only per constitution).

---

## Core Entities

### 1. Uniform Resource (UR)

**Description**: Canonical representation of encoded CBOR payload following BC-UR standard

**Fields**:
- `type` (string): UR type identifier (e.g., "crypto-seed", "crypto-hdkey")
  - Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
  - Validation: Must match registered type or be manually overridden
- `cbor` (Uint8Array): Raw CBOR-encoded payload
- `checksum` (string): UR checksum (library-calculated)
- `isMultiPart` (boolean): True if fountain-encoded
- `sequenceInfo` (object | null): Present only if multiPart
  - `seqNum` (number): Current sequence number
  - `seqLen` (number): Total sequence length
  - `messageLen` (number): Original message length in bytes
  - `checksum` (string): Multi-part checksum

**Lifecycle**:
1. **Created from (decode path)**:
   - Single UR string (`ur:{type}/{data}`)
   - Multi-part UR assembly (fountain decoder output)
   - Hex + type override (CBOR-encoded hex)
   - Bytewords + type (any style: minimal/standard/uri)
2. **Created from (encode path)**:
   - JavaScript object + type (via CBOR encoding)
   - JSON string + type (parsed then encoded)
   - Raw CBOR bytes + type
3. **Converted to**:
   - Decoded views: JSON, Diagnostic notation, Commented, JavaScript object
   - Re-encoded formats: Hex, Bytewords (any style), Multi-part UR
4. **Forwarded to**: Multi-UR Generator (if single-part), Converter (if scanned/assembled)

**Validation Rules**:
- **Decode path**: UR string must start with "ur:" prefix, valid CBOR payload
- **Encode path**: JavaScript object must be CBOR-serializable, type required
- Type must be lowercase alphanumeric with hyphens only (both paths)
- Multi-part checksum must match across all fragments
- Validation via `UR.fromString()` (decode) or `UR.pipeline.encode()` (encode) - never manual parse

**State Transitions (Bidirectional Pipeline)**:
```
                    ┌─────────────────────────────────────┐
                    │         CBOR (Uint8Array)           │
                    └─────────────────────────────────────┘
                         ↑ encode          ↓ decode
                         │                 │
        ┌────────────────┴─────┐     ┌─────┴────────────────┐
        │  JavaScript Object    │     │    UR String         │
        │  (type required)      │     │  (ur:{type}/{data})  │
        └────────────────┬─────┘     └─────┬────────────────┘
                         │                 │
                         ↓                 ↓
                    Validation          Validation
                         │                 │
                         ↓ error     error ↓
                    [Error State] ←→ [Error State]
                         │                 │
                         ↓ success   success ↓
                    ┌─────────────────────────────────────┐
                    │    Cached & Displayed Conversion    │
                    └─────────────────────────────────────┘
                              ↓
                    ┌─────────────────────────┐
                    │  Output Formats         │
                    │  - Hex                  │
                    │  - Bytewords (3 styles) │
                    │  - Multi-part UR        │
                    │  - JSON/Diagnostic etc  │
                    └─────────────────────────┘

Forward Flow:  JavaScript → CBOR → UR → Bytewords/Hex/Multi-UR
Reverse Flow:  Multi-UR/UR/Bytewords/Hex → CBOR → JavaScript
Cross Flows:   Any format → Any other format (via canonical CBOR intermediate)
```

---

### 2. Multi-Part UR Sequence

**Description**: Ordered set of fountain-encoded UR fragments representing single original UR

**Fields**:
- `fragments` (Array<string>): Ordered UR fragment strings
  - Each fragment: "ur:{type}/{seqNum}-{seqLen}/{data}"
  - Example: "ur:crypto-seed/1-5/abcd..."
- `originalUR` (UR): Source UR before fountain encoding
- `encoderParams` (object): Fountain encoder configuration
  - `maxFragmentLength` (number): 10-200, default 100
  - `minFragmentLength` (number): 5-50, default 10
  - `firstSeqNum` (number): Starting sequence, default 0
  - `repeatAfterRatio` (number): 0=infinite, default 2
- `qrSettings` (object): QR code rendering configuration
  - `size` (number): 200-800px, default 400
  - `errorCorrection` ('L'|'M'|'Q'|'H'): Default 'L'
  - `frameRate` (number): 1-30 fps, default 5
- `metadata` (object):
  - `totalFragments` (number): fragments.length
  - `isInfinite` (boolean): repeatAfterRatio === 0
  - `estimatedScanTime` (number): fragments.length / frameRate (seconds)

**Lifecycle**:
1. Generated from: Single UR (forwarded from converter) or manual input
2. Rendered as: Animated QR sequence, scrollable text list, or streaming preview
3. Exported as: Text file (finite only), QR frame images (finite only)

**Validation Rules**:
- `minFragmentLength` < `maxFragmentLength`
- `maxFragmentLength` ∈ [10, 200]
- `minFragmentLength` ∈ [5, 50]
- `frameRate` ∈ [1, 30]
- `size` ∈ [200, 800]
- Downloads disabled when `isInfinite` = true

**State Transitions**:
```
[UR Input] → [Encoder Params] → [Generation] → [Fragments Ready]
                                      ↓
                                 [QR Animation] ⟷ [Play/Pause/Restart]
                                      ↓ (finite only)
                                 [Export Available]
```

---

### 3. Fountain Decoder State

**Description**: Aggregated state from `UrFountainDecoder` tracking multi-part UR assembly

**Fields** (derived from library):
- `seenBlocks` (Array<boolean>): Bitmap of scanned fragments (includes redundant fountain fragments)
  - Not directly visualized (informational only)
- `decodedBlocks` (Array<boolean>): Bitmap of resolved original blocks
  - **Primary progress indicator**: 1=decoded, 0=pending
  - Grid visualization source (green=true, gray=false)
- `expectedBlockCount` (number): Total original blocks needed
- `progress` (number): 0.0-1.0 from `decoder.getProgress()`
- `urType` (string): Detected UR type from fragments
- `isComplete` (boolean): `progress === 1.0`
- `assembledUR` (UR | null): Final UR when complete

**Lifecycle**:
1. Initialized: Empty decoder on scanner tab activation
2. Updated: Each QR frame scanned → `decoder.receivePartUr()`
3. Reset: Manual reset button → `decoder.reset()`
4. Completed: `isComplete` true → auto-forward to converter

**Validation Rules**:
- All scanned fragments must have matching `urType` (mismatch triggers warning)
- Fragments with different checksums rejected (incompatible URs)
- Progress must be monotonically increasing (fountain property)

**State Transitions**:
```
[Empty] → [Scanning] → [Partial Progress] → [Complete]
             ↓              ↓                     ↓
        [Type Mismatch] [Manual Reset]   [Forward to Converter]
```

---

### 4. QR Code Frame

**Description**: Individual QR image representing one UR fragment with playback metadata

**Fields**:
- `partIndex` (number): Current part (0-based)
- `totalParts` (number): Total fragments in sequence
- `urString` (string): UR fragment text
- `qrDataURL` (string): Canvas-rendered QR image as data URL
- `settings` (object):
  - `size` (number): QR dimensions in pixels
  - `ecLevel` ('L'|'M'|'Q'|'H'): Error correction level
  - `mode` (string): 'alphanumeric' (bytewords-optimized)
- `timestamp` (number): Frame generation time (for animation timing)

**Lifecycle**:
1. Generated: From multi-part UR fragment + QR settings
2. Rendered: To canvas in animation loop
3. Exported: As PNG image (finite sequences only)

**Validation Rules**:
- `partIndex` < `totalParts`
- `urString` must be valid UR fragment format
- `size` must match parent sequence `qrSettings.size`

**Animation Loop**:
```
[Generate Frames] → [Animation Queue] → [requestAnimationFrame]
                                              ↓
                                        [Render Frame N]
                                              ↓
                                    [Increment N % totalParts]
                                              ↓
                                    [Loop or Stop (based on repeatAfterRatio)]
```

---

### 5. Registry Type

**Description**: Registered UR type definition from ur-registry packages

**Fields**:
- `tag` (number): CBOR tag number (unique identifier)
- `urType` (string): UR type string (kebab-case)
- `package` (string): Source package name
  - 'blockchain-commons' | 'coin-identity' | 'sync' | 'hex-string' | 'sign' | 'uuid'
- `cddl` (string): CDDL schema definition (if available)
- `description` (string): Human-readable summary
- `docLink` (string | null): Official documentation URL
- `isLoaded` (boolean): True if package dynamically loaded

**Lifecycle**:
1. Listed: On registry browser tab load (metadata only)
2. Expanded: User clicks type → load CDDL (if available)
3. Loaded: Dynamic import of package when type used in converter
4. Matched: Highlight when decoded UR matches registered type

**Validation Rules**:
- `tag` must be unique across all packages
- `urType` must match pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `package` must be one of the 6 supported packages

**Loading States**:
```
[Listed (metadata)] → [Expand Request] → [Load Package] → [Available for Use]
                           ↓ error
                      [Show Error: Package unavailable]
```

---

### 6. Console Debug Interface

**Description**: Globally exposed debugging interface for inspecting any decoded CBOR (registry item or not)

**Automatic Exposure** (on every conversion):
When user converts to "Decoded CBOR (JavaScript)" format, the result is automatically exposed as:
```javascript
window.$lastDecoded // Most recent decoded value
window.$decodedHistory // Array of last 10 decoded values (LRU)
```

**Fields** (auto-populated):
- `value` (any): Decoded JavaScript object/primitive
- `cbor` (object):
  - `hex` (string): CBOR bytes as hex
  - `diagnostic` (string): CBOR diagnostic notation
  - `tags` (Array<number>): All CBOR tags in structure (e.g., [37, 305])
  - `majorTypes` (Array<string>): CBOR major types present (e.g., ["map", "array", "bytes"])
- `ur` (object | null): UR metadata if input was UR
  - `type` (string): UR type (e.g., "crypto-seed")
  - `urString` (string): Full ur:type/data string
  - `isRegistered` (boolean): True if type found in registry
  - `registryPackage` (string | null): Package name if registered (e.g., "blockchain-commons")
- `registry` (object | null): Present only if UR type is registered
  - `tag` (number): CBOR tag number
  - `cddl` (string): CDDL schema definition
  - `docLink` (string | null): Documentation URL
- `structure` (object): Deep structure analysis
  - `depth` (number): Max nesting level
  - `keys` (Array<string>): All object keys (flattened)
  - `types` (object): Key → JS type mapping
- `metadata` (object):
  - `decodedAt` (number): Timestamp
  - `source` ('converter' | 'scanner' | 'registry'): Origin tab
  - `inputFormat` ('ur' | 'hex' | 'bytewords' | 'multi-ur'): Source format

**Console API Methods** (available globally):
```javascript
// Inspect current decoded value
window.$lastDecoded
window.$lastDecoded.cbor.tags           // [37] for crypto-seed
window.$lastDecoded.ur.type             // "crypto-seed"
window.$lastDecoded.registry.cddl       // Full CDDL schema
window.$lastDecoded.structure.keys      // ["payload", "birthdate"]

// History navigation
window.$decodedHistory[0]               // Most recent
window.$decodedHistory.length           // Up to 10

// Helper methods (window.$cbor namespace)
window.$cbor.inspect(value)             // Pretty-print with CBOR tags highlighted
window.$cbor.diff(index1, index2)       // Compare two decoded values from history
window.$cbor.export(format)             // Export as JSON/Diagnostic/Hex
window.$cbor.clear()                    // Clear history

// Registry lookup (works for any UR type)
window.$cbor.findType(urType)           // Get registry info for type
window.$cbor.listTags()                 // List all CBOR tags in current value
```

**Console Output Format** (auto-logged on decode):
```javascript
// Example: Decoded crypto-seed
ℹ️ Decoded CBOR (crypto-seed)
┌─────────────────────────────────────────────────────────────
│ UR Type: crypto-seed (registered ✓)
│ CBOR Tags: [37, 305]
│ Package: @ngraveio/ur-blockchain-commons
│ Structure: { payload: Uint8Array(16), birthdate: Number }
│ 
│ 📋 Access via: window.$lastDecoded
│ 📖 CDDL: window.$lastDecoded.registry.cddl
│ 🔍 Inspect: window.$cbor.inspect(window.$lastDecoded.value)
└─────────────────────────────────────────────────────────────

// Example: Unknown CBOR (not registered)
ℹ️ Decoded CBOR (unknown)
┌─────────────────────────────────────────────────────────────
│ UR Type: custom-data (not registered ⚠️)
│ CBOR Tags: [42]
│ Major Types: map, bytes, uint
│ Structure: { data: Uint8Array(32), version: 1 }
│ 
│ 📋 Access via: window.$lastDecoded
│ 🔍 Inspect: window.$cbor.inspect(window.$lastDecoded.value)
└─────────────────────────────────────────────────────────────
```

**Lifecycle**:
1. **Auto-triggered**: Every conversion to "Decoded CBOR (JavaScript)" format
2. **Exposed**: `window.$lastDecoded` updated immediately
3. **Logged**: Console output with formatted summary
4. **Accessible**: User can interact with decoded value in DevTools
5. **Persisted**: Added to `$decodedHistory` (max 10 entries, LRU)

**Integration with Registry Items**:
- If decoded UR matches registry type → `registry` field populated
- If no match → `registry` is null but structure analysis still available
- Console hints show how to create registry item from decoded value:
  ```javascript
  💡 Create registry item: window.registryPlayground.createItem('crypto-seed', window.$lastDecoded.value)
  ```

---

### 7. Registry Item (Console Playground)

**Description**: Explicitly created instance of registered type for experimentation (distinct from auto-exposed decoded values)

**Fields**:
- `type` (RegistryType): Reference to registry type definition
- `data` (object): JavaScript object conforming to CDDL schema
- `encoded` (object):
  - `cbor` (string): Hex-encoded CBOR
  - `ur` (string): Full UR string
  - `bytewords` (string): Minimal bytewords representation
- `validation` (object):
  - `isValid` (boolean): CDDL compliance (post-MVP: full validation)
  - `errors` (Array<string>): Validation error messages
- `metadata` (object):
  - `createdAt` (number): Timestamp
  - `source` ('console' | 'decoded'): Creation origin

**Lifecycle** (explicit user-driven):
1. Created: `window.registryPlayground.createItem(type, data)`
2. Encoded: `.encode()` → CBOR hex
3. Decoded: `window.registryPlayground.decode(cborHex)` → JavaScript object
4. Validated: `.validate()` → CDDL compliance check (stub in MVP)

**Console API Methods**:
```javascript
// Exposed via window.registryPlayground
createItem(typeName, data) → RegistryItem
createFromDecoded(index?) → RegistryItem // Use $decodedHistory[index] (default: 0)
encode(item) → { cbor, ur, bytewords }
decode(cborHex) → object
validate(cddlText) → { isValid, errors } // Stub: schema presence check only in MVP
```

**Relationship with Console Debug Interface**:
- Auto-decoded values → `window.$lastDecoded` (read-only inspection)
- Registry items → `window.registryPlayground` (read-write experimentation)
- Bridge: `createFromDecoded()` promotes auto-decoded value to editable registry item

---

### 8. Session Transfer Payload

**Description**: Temporary data structure for cross-tab state forwarding

**Fields**:
- `sourceTab` ('converter' | 'multi-ur' | 'scanner' | 'registry'): Origin tab
- `targetTab` ('converter' | 'multi-ur' | 'scanner' | 'registry'): Destination tab
- `dataType` ('ur' | 'multi-ur' | 'registry-type'): Payload type
- `payload` (object): Tab-specific data
  - For 'ur': `{ urString, type, cbor }`
  - For 'multi-ur': `{ fragments, encoderParams }`
  - For 'registry-type': `{ tag, urType, package }`
- `timestamp` (number): Creation time (for expiration)
- `ttl` (number): Time-to-live in milliseconds (default: 5 minutes)

**Storage**:
- sessionStorage key: `forward-${targetTab}`
- URL hash param: `data` (base64-encoded JSON)
- Cleanup: Removed after read or page unload

**Lifecycle**:
```
[Tab A] → [Create Payload] → [Store in sessionStorage + URL]
                                      ↓
                              [Navigate to Tab B]
                                      ↓
                          [Read Payload] → [Cleanup] → [Use Data]
```

**Validation Rules**:
- `timestamp + ttl` must be > `Date.now()` (expired payloads rejected)
- `dataType` must match expected type for `targetTab`
- Payload structure validated before use

---

## Validation Summary

### Global Validation Rules

1. **UR Type Pattern**: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
2. **Hex Input**: Even-length string, valid hex characters [0-9a-fA-F]
3. **Bytewords**: 4-letter words (standard) or 2-char pairs (minimal)
4. **Multi-part UR**: Fragments must share same type and checksum
5. **Fountain Params**: min < max, both within specified ranges
6. **QR Settings**: All numeric values within documented ranges
7. **Cache Keys**: Deterministic composite keys (input|format|options)

### Error Categories

| Category | Examples | User Message Pattern |
|----------|----------|---------------------|
| Parse Error | Invalid hex, malformed UR | "Invalid {format}: {specific reason}" |
| Validation Error | Type mismatch, param out of range | "{Field} must be {constraint}" |
| Assembly Error | Incomplete multi-part, checksum mismatch | "Multi-part assembly {status}: {details}" |
| System Error | Camera denied, library exception | "{Feature} unavailable: {reason}" |

---

## State Persistence

### In-Memory Only
- Conversion cache (LRU Map, 120 entries)
- Current tab state (form values, UI toggles)
- Fountain decoder state (decoder instance)
- Animation frame queue
- **Console debug state** (`window.$lastDecoded`, `window.$decodedHistory` - max 10 entries)

### sessionStorage (Temporary)
- Cross-tab forwarded data (cleared on read)
- Generator settings (cleared on tab close)
- Decoder partial progress (cleared on reset)

### No Persistence
- ❌ Conversion history (no localStorage)
- ❌ User preferences (no cookies)
- ❌ Analytics data (no external tracking)
- ❌ Decoded URs (privacy-first per constitution)
- ❌ Console debug history beyond 10 entries (auto-pruned LRU)

---

## Data Flow Diagram

### Tab Navigation & Data Forwarding
```
┌─────────────┐
│  Converter  │ → Single UR → ┌───────────────┐
│   (Tab 1)   │               │  Multi-UR Gen │
└─────────────┘               │    (Tab 2)    │
      ↑                       └───────────────┘
      │                              ↓
      │                       QR Animation
      │                              ↓
      │                       ┌───────────────┐
      └───── Assembled UR ────│  QR Scanner   │
                              │    (Tab 3)    │
                              └───────────────┘
                                     │
                                     ↓ (decoded UR)
                              ┌───────────────────────────┐
                              │  Console Debug Interface  │
                              │  window.$lastDecoded      │
                              │  window.$cbor.*           │
                              └───────────────────────────┘
                                     ↕️
                              ┌───────────────────────────┐
                              │  Registry Playground      │
                              │  window.registryPlayground│
                              └───────────────────────────┘

Registry Types ────────────────→ All Tabs (dynamic loading)
                    └─→ Console Debug Interface (automatic type detection)

Console Playground (window.registryPlayground) ←→ Registry Browser (Tab 4)
                                               ↖
                                                window.$lastDecoded (auto-exposure)
```

### Bidirectional Conversion Pipeline (Tab 1 - Converter)
```
                    Input Formats
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Multi-part UR    Single UR         Bytewords
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                  UrFountainDecoder
                  UR.fromString()
                  BytewordEncoding.decode()
                         │
                         ↓
                    ┌─────────┐
                    │  CBOR   │ ←──── Hex Input
                    │(Uint8Array)     (even length)
                    └─────────┘
                    ↗         ↘
            decode ↗           ↘ encode
                  ↗             ↘
                 ↓               ↓
        ┌──────────────┐   ┌──────────────┐
        │  JavaScript  │   │   UR String  │
        │    Object    │   │ (ur:{type}/…)│
        └──────────────┘   └──────────────┘
                 ↓               ↓
            Decoded Views    Encoded Formats
                 │               │
        ┌────────┼────────┐     ├─── Bytewords (minimal/standard/uri)
        │        │        │     ├─── Hex
   JSON  Diagnostic  Commented  └─── Multi-part UR → Tab 2
   View    Notation   CDDL           
        │
        ↓
   window.$lastDecoded (auto-exposed to console)
        ↓
   window.$cbor.inspect() → Pretty-printed with CBOR tags, UR type, registry info

Bidirectional Examples:
→ Forward:  JS Object + type → CBOR → Bytewords → UR
← Reverse:  UR → Bytewords → CBOR → JS Object (JSON view) → Console Debug
↔ Cross:    Hex → CBOR → UR → Multi-part UR
🔍 Debug:   Any decoded → window.$lastDecoded (structure, tags, CDDL if registered)
```

---

## Summary

**8 Core Entities Defined**:
1. **Uniform Resource (UR)** - Bidirectional CBOR ↔ UR conversion with multi-format support
2. **Multi-Part UR Sequence** - Fountain-encoded fragments with QR animation settings
3. **Fountain Decoder State** - Multi-part UR assembly progress tracking
4. **QR Code Frame** - Individual QR images for animation loop
5. **Registry Type** - Registered UR type definitions from ur-registry packages
6. **Console Debug Interface** - Auto-exposed decoded CBOR inspection (`window.$lastDecoded`, `window.$cbor.*`)
7. **Registry Item** - Explicit console playground instances for experimentation
8. **Session Transfer Payload** - Cross-tab data forwarding (temporary)

**Key Features**:
- ✅ Bidirectional conversion pipeline (encode & decode paths)
- ✅ Automatic console debugging for all decoded CBOR (registry item or not)
- ✅ CBOR tag inspection and structure analysis
- ✅ Registry type detection with CDDL schema access
- ✅ Console API for interactive exploration (`window.$cbor.*`, `window.registryPlayground.*`)
- ✅ Decoded value history (last 10 entries, LRU)
- ✅ Bridge between auto-exposure and explicit registry items

Ready for contract generation.


