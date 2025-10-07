# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**bcur.me** is a client-only web playground for exploring BC-UR (Uniform Resources) encoding with real-time format conversion. It enables conversion between UR, Bytewords, Hex, and CBOR formats, including multi-part fountain-encoded UR assembly.

**Core Principles:**
- Client-only (no backend, no tracking, no data persistence)
- Vanilla JavaScript with ES modules from CDN
- Trust the BC-UR library—never reimplement encoding pipelines
- Privacy-first: all processing happens in browser

## Development Commands

```bash
# Start development server (opens at http://localhost:8000)
yarn dev
# or
yarn start

# Alternative local servers
python3 -m http.server 8000
npx serve
php -S localhost:8000
```

**Requirements:** Modern browser with ES modules, Clipboard API, CSS Grid support (Chrome 90+, Firefox 88+, Safari 14+)

## Architecture

### Current Implementation (v0.1.0)
- **Single-page application**: `index.html` (UI shell) + `demo.js` (FormatConverter class)
- **BC-UR Library**: `@ngraveio/bc-ur@2.0.0-beta.9` from esm.sh CDN (pinned version)
- **No build tooling**: Pure ESM modules, no compilation step

### Planned Architecture (v0.2.0+)
Multi-tab SPA with hash-based routing:
- Tab 1: Converter (current functionality)
- Tab 2: Multi-UR Generator with animated QR codes
- Tab 3: QR Scanner with fountain decoder
- Tab 4: Registry Developer Tools

See `.github/PROJECT_ROADMAP.md` for detailed architecture decisions.

### FormatConverter Class (`demo.js`)

**Key Responsibilities:**
- **Format detection**: Auto-detect input format (multi-part UR → single UR → hex → bytewords)
- **Conversion pipeline**: Orchestrate transformations through canonical stages
- **Multi-UR assembly**: Use `UrFountainDecoder` for fountain-encoded multi-part URs
- **Pipeline visualization**: Update UI with directional arrows showing conversion flow
- **Caching**: Store conversion results (120 items max) for instant retrieval
- **UR type management**: Auto-detect via registry or accept manual override

**Core Methods:**
- `detectFormat(input)` - Pattern-based format detection with priority ordering
- `performConversion()` - Main conversion orchestrator
- `assembleMultiUR(input)` - Multi-part UR decoding with progress tracking
- `simplePipelineViz()` - Visual pipeline status updates

## BC-UR Library Integration

### Pipeline Stages
Canonical conversion flow: `multiur → ur → bytewords → hex → decoded`

### Core Classes Used

```javascript
// From @ngraveio/bc-ur@2.0.0-beta.9
import {
    UR,                   // Core UR encoding/decoding
    UrFountainDecoder,    // Multi-part UR assembly
    UrFountainEncoder,    // Multi-part UR generation (planned)
    BytewordEncoding,     // Bytewords with style support (minimal/standard/uri)
    cbor2                 // CBOR diagnostics (comment/diagnose functions)
} from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';
```

### Key Integration Patterns

**Never manually parse UR strings**—always use library methods:
```javascript
// Correct: Use UR.pipeline for transformations
const hex = UR.pipeline.encode(data, { until: 'hex' });
const decoded = UR.pipeline.decode(hex, { from: 'hex' });

// Correct: Use BytewordEncoding for style variants
const encoder = new BytewordEncoding('minimal'); // or 'standard', 'uri'
const bytewords = encoder.encode(hexString);

// Correct: Use UrFountainDecoder for multi-part assembly
const decoder = new UrFountainDecoder();
urParts.forEach(part => decoder.receivePartUr(part));
if (decoder.isComplete()) {
  const result = decoder.resultUr.toString();
}
```

### Format Detection Priority
1. Multi-part UR (lines with `ur:` prefix or `/\d+-\d+/` pattern)
2. Single UR (starts with `ur:`)
3. Hex (even-length `[0-9a-fA-F]+`)
4. Bytewords (4-letter words or 2-char minimal pairs)
5. Decoded JSON (manual selection only)

## Project Management Workflow

**Before implementing ANY feature:**

1. **Read planning documents in order:**
   - `.github/PROJECT_ROADMAP.md` - High-level vision and architecture
   - `.github/FEATURES_TODO.md` - Current task status and priorities
   - `.github/TASK-XXX-*.md` - Detailed spec for specific task

2. **Consult reference projects:**
   - `reference_projects/bc-ur/README.md` - **Primary API documentation** (source of truth)
   - `reference_projects/bc-ur/src/classes/` - Implementation examples
   - `reference_projects/bc-ur/tests/` - Test cases and usage patterns
   - `reference_projects/ur-registry/` - Registry patterns
   - `reference_projects/animated-QR-tool/` - QR animation examples

3. **Implementation rule:** If README conflicts with assumptions, **README wins**

4. **After completing tasks:** Update `.github/FEATURES_TODO.md` status (🔴 TODO → 🟡 IN PROGRESS → 🟢 DONE)

## Key Implementation Patterns

### 1. Trust the Library
- **Never reimplement** encoding pipelines—use `UR.pipeline`, `BytewordEncoding`, `UrFountainEncoder/Decoder`
- **Always verify** behavior against `reference_projects/bc-ur/README.md` before writing code
- Study reference implementations before creating new features

### 2. Explicit Error Handling
Every failure must surface visible, contextual UI messages:
```javascript
// Good: Specific, actionable error
throw new Error('Invalid hex input (odd length or non-hex characters)');

// Good: Progress information for incomplete multi-UR
throw new Error(`Incomplete multi-part UR. Progress: ${(progress * 100).toFixed(1)}%`);

// Bad: Silent failure (never do this)
try { convert(); } catch(e) { /* ignore */ }
```

### 3. Performance Optimizations

**Debouncing:**
- Typing: 150ms delay
- Paste: 10ms delay
- UR type override input: 220ms delay

**Conversion Caching:**
- Cache key: `[rawInput, format, outputFormat, urTypeOverride, bytewordsStyles].join('|')`
- Max size: 120 items (LRU-style eviction)

**Pipeline Visualization:**
- Instant updates with color-coded status (green/red/gray)
- Directional arrows (→ forward, ← reverse)
- Shake animation on errors

### 4. UR Type Management
- **Auto-detection**: Via registry using `decoded.toUr()`
- **Manual override**: Pattern validation `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- **Fallback**: `unknown-tag` for untagged CBOR
- **UI feedback**: Real-time validation with border color indicators

### 5. Bytewords Style Control
Independent input/output style selection:
- `minimal`: 2-character pairs (compact)
- `standard`: 4-letter words (readable)
- `uri`: URL-safe encoding

### 6. No Dangerous Features
- ❌ No persistent storage (localStorage/sessionStorage/IndexedDB)
  - Exception: Temporary sessionStorage for tab forwarding (cleared on close)
- ❌ No cryptographic key handling
- ❌ No wallet functionality
- ❌ No backend API calls

## Reference Projects Usage

**Before implementing any BC-UR feature, follow this workflow:**

1. Read `reference_projects/bc-ur/README.md` for API documentation
2. Check `reference_projects/bc-ur/src/classes/` for class implementations:
   - `UrFountainEncoder.ts` - Multi-UR generation patterns
   - `UrFountainDecoder.ts` - Multi-UR assembly with progress
   - `RegistryItem.ts` - Registry factory and validation
   - `UR.ts` - Core UR class and pipeline methods
3. Review `reference_projects/bc-ur/tests/` for test cases and examples
4. Study `reference_projects/animated-QR-tool/` for QR animation patterns

**Key Reference Files:**
- `bc-ur/README.md` - Authoritative API reference
- `ur-registry/README.md` - Registry system and CBOR tags
- `animated-QR-tool/README.md` - QR animation patterns

**Golden Rule:** Never assume library behavior—always verify against reference implementations.

## File Structure

### Current
```
bcur.me/
├── index.html              # Main UI shell with inline CSS
├── demo.js                 # FormatConverter class
├── package.json            # Dependencies (live-server only)
├── .github/                # Project planning & task tracking
│   ├── copilot-instructions.md
│   ├── PROJECT_ROADMAP.md
│   ├── FEATURES_TODO.md
│   └── TASK-*.md           # Detailed implementation specs
└── reference_projects/     # Read-only library examples (not deployed)
    ├── bc-ur/              # Primary BC-UR API reference
    ├── ur-registry/        # Registry patterns
    └── animated-QR-tool/   # QR animation examples
```

### Planned (Post-Refactor)
```
bcur.me/
├── index.html              # Tab navigation shell
├── js/
│   ├── converter.js        # Tab 1 (current demo.js)
│   ├── multi-ur.js         # Tab 2 (Multi-UR generator)
│   ├── scanner.js          # Tab 3 (QR scanner)
│   ├── registry.js         # Tab 4 (Registry tools)
│   ├── router.js           # Hash-based navigation
│   └── shared.js           # Common utilities
└── css/
    ├── main.css            # Global styles
    └── tabs.css            # Tab-specific styles
```

## Current Features (v0.1.0)

✅ **Implemented:**
- UR ↔ Bytewords ↔ Hex ↔ CBOR conversion
- Multi-part UR assembly with `UrFountainDecoder`
- Format auto-detection
- Pipeline visualization with directional flow
- Conversion caching for performance
- Copy to clipboard with visual feedback
- UR type override with validation
- Bytewords style selector (minimal/standard/uri)
- Decoded CBOR variants (JSON/Diagnostic/Commented/JavaScript)

📋 **Planned (see FEATURES_TODO.md):**
- Multi-tab architecture
- Multi-UR generator with animated QR codes
- QR scanner with camera access
- Registry developer tools

## Deployment

**Production:** GitHub Pages with automatic deployment
- Workflow: `.github/workflows/deploy.yml`
- Live URL: `https://bcur.me` or `https://irfan798.github.io/bcur.me/`
- Trigger: Push to `main` branch

**Local development:** Use `yarn dev` (starts live-server on port 8000)

## Common Tasks

### Adding a New Format
1. Update `PIPELINE_STAGES` array in `demo.js`
2. Add detection logic in `detectFormat()` (earlier = higher priority)
3. Branch conversion logic in `performConversion()`
4. Update `getFormatLabel()` for UI display
5. Test all format combinations

### Modifying Error Messages
See `.github/copilot-instructions.md` section "Error Messaging Standards" for required patterns

### Testing Conversions
Use example buttons in UI or test with reference data from `reference_projects/bc-ur/tests/`

## Important Notes

- **Security:** This is a development tool, not audited for handling secrets
- **Browser compatibility:** Requires modern browser (see Development Commands section)
- **CDN dependency:** Uses pinned version `@ngraveio/bc-ur@2.0.0-beta.9` from esm.sh
- **No offline support:** Requires internet for CDN imports (local fallback available in comments)

## Additional Resources

- **Copilot Instructions:** `.github/copilot-instructions.md` - Detailed implementation patterns
- **Project Roadmap:** `.github/PROJECT_ROADMAP.md` - Long-term vision and phases
- **Task Tracker:** `.github/FEATURES_TODO.md` - Current sprint and progress
- **BC-UR Spec:** [Blockchain Commons Research](https://github.com/BlockchainCommons/Research)
