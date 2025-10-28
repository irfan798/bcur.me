# Quickstart: BC-UR Playground

**Feature**: BC-UR Playground | **Date**: 2025-10-08

## Prerequisites

- **Browser**: Chrome 90+, Firefox 88+, or Safari 14+ (desktop or mobile)
- **HTTPS**: Required for camera access (use localhost for development)
- **No build tools**: Pure ESM, no npm/yarn installation needed for running
- **Development tools** (optional): yarn for local package development

---

## Running the Application

### Option 1: Direct File Access (Quick Start)

1. **Clone repository**:
   ```bash
   git clone https://github.com/irfan798/bcur.me.git
   cd bcur.me
   git checkout 002-bc-ur-playground
   ```

2. **Serve locally** (HTTPS required for camera):
   ```bash
   # ALWAYS use yarn dev (checks if port is free first)
   yarn dev
   
   # Check if already running:
   lsof -ti:8000  # If returns PID, server is running
   ```

3. **Open browser**:
   ```
   http://localhost:8000
   ```

4. **Navigate tabs**:
   - Format Converter: `http://localhost:8000#converter`
   - Multi-UR Generator: `http://localhost:8000#multi-ur`
   - QR Scanner: `http://localhost:8000#scanner`
   - Registry Browser: `http://localhost:8000#registry`

---

### Option 2: Development Mode (Local Packages)

For development with local bc-ur packages:

1. **Install dependencies**:
   ```bash
   yarn install
   # or
   npm install
   ```

2. **Update import maps** in `index.html` to use local packages:
   ```html
   <script type="importmap">
   {
     "imports": {
       "@ngraveio/bc-ur": "./node_modules/@ngraveio/bc-ur/dist/index.js",
       "@ngraveio/ur-blockchain-commons": "./node_modules/@ngraveio/ur-blockchain-commons/dist/index.js",
       // ... other packages
     }
   }
   </script>
   ```

3. **Serve and develop**:
   ```bash
   npx live-server --port=8000 --watch=js,css,index.html
   ```

---

## Project Structure Overview

```
bcur.me/
├── index.html              # Main application shell
├── js/
│   ├── converter.js        # Tab 1: Format Converter
│   ├── multi-ur.js         # Tab 2: Multi-UR Generator
│   ├── scanner.js          # Tab 3: QR Scanner
│   ├── registry.js         # Tab 4: Registry Browser
│   ├── router.js           # Hash-based tab routing
│   └── shared.js           # Utilities (cache, debounce, errors)
├── css/
│   ├── main.css            # Global styles
│   └── tabs.css            # Tab-specific styles
├── specs/002-bc-ur-playground/
│   ├── spec.md             # Feature specification
│   ├── plan.md             # This implementation plan
│   ├── research.md         # Technical research
│   ├── data-model.md       # Entity definitions
│   ├── contracts/          # State contracts
│   └── quickstart.md       # This file
└── reference_projects/     # READ-ONLY library examples
    ├── bc-ur/              # Primary bc-ur reference
    ├── ur-registry/        # Registry patterns
    └── animated-QR-tool/   # QR animation examples
```

---

## Core Dependencies (CDN)

Production uses CDN imports with version pinning:

```html
<!-- index.html -->
<script type="module">
  import { UR, BytewordEncoding, UrFountainEncoder, UrFountainDecoder } 
    from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';
  
  import QRCode from 'https://esm.sh/qrcode@1.5.3';
  import QrScanner from 'https://esm.sh/qr-scanner@1.4.2';
  
  // Dynamic imports for ur-registry packages
  const urSync = await import('https://esm.sh/@ngraveio/ur-sync@2.0.0');
</script>
```

**Pinned Versions** (as of 2025-10-08):
- `@ngraveio/bc-ur@2.0.0-beta.9` - Core UR encoding/decoding
- `@ngraveio/ur-blockchain-commons@2.0.1-beta.2` - BC types (crypto-seed, crypto-hdkey, crypto-psbt, crypto-account, crypto-output, crypto-eckey)
- `@ngraveio/ur-coin-identity@2.0.1-beta.2` - Coin identity type
- `@ngraveio/ur-sync@2.0.1-beta.2` - Account/portfolio types (detailed-account, portfolio-coin, portfolio-metadata, portfolio)
- `@ngraveio/ur-hex-string@2.0.1-beta.2` - Hex string encoding type
- `@ngraveio/ur-sign@2.0.1-beta.2` - Sign protocols (sign-request, sign-response)
- `@ngraveio/ur-uuid@2.0.1-beta.2` - UUID type
- `qrcode@1.5.3` - QR code generation (canvas-based)
- `qr-scanner@1.4.2` - QR code scanning (Web Worker)

---

## Supported Registry Types

The converter automatically decodes registered UR types into typed class instances with expandable property inspection and console access.

### Package: @ngraveio/ur-blockchain-commons
- **crypto-seed** - BIP39 mnemonic seed with optional name/creation date
- **crypto-hdkey** - Hierarchical deterministic key with derivation path
- **crypto-psbt** - Partially Signed Bitcoin Transaction
- **crypto-account** - Bitcoin account descriptor with master fingerprint
- **crypto-output** - Output descriptor (script type + key)
- **crypto-eckey** - Elliptic curve key (private or public)

### Package: @ngraveio/ur-coin-identity
- **coin-identity** - Unique coin identifier (blockchain + network + asset)

### Package: @ngraveio/ur-sync
- **detailed-account** - Full account details with output descriptors
- **portfolio-coin** - Coin portfolio entry with holdings
- **portfolio-metadata** - Portfolio metadata (name, version)
- **portfolio** - Complete portfolio with multiple coins

### Package: @ngraveio/ur-hex-string
- **hex-string** - Plain hex string encoding

### Package: @ngraveio/ur-sign
- **sign-request** - Signing request with payload and metadata
- **sign-response** - Signing response with signature

### Package: @ngraveio/ur-uuid
- **uuid** - UUID identifier

**Usage Example**:
```javascript
// Paste UR in converter:
// ur:detailed-account/oeadtpdagdaolftaaddyoeadlocsdyykaeykaeykaoykaocyemgwkelbaeaehnax...

// Output view: Select "Registry Item"
// Shows: DetailedAccount class with expandable properties

// Console access:
window.$lastRegistryItem instanceof DetailedAccount // true
window.$lastRegistryItem.device                     // "Ngrave ZERO"
window.$lastRegistryItem.encode()                   // Returns original UR string
```

---

## Development Workflow

### 1. Understanding the Feature

**Read in order**:
1. `specs/002-bc-ur-playground/spec.md` - User stories & requirements
2. `specs/002-bc-ur-playground/plan.md` - Technical approach
3. `specs/002-bc-ur-playground/research.md` - Integration patterns
4. `specs/002-bc-ur-playground/data-model.md` - Entity structures

**Reference authority** (when implementing):
1. `reference_projects/bc-ur/README.md` - bc-ur API docs
2. `reference_projects/bc-ur/src/classes/` - Library implementations
3. `reference_projects/bc-ur/tests/` - Test cases for validation

### 2. Implementing a Tab

**Example: Format Converter (js/converter.js)**

```javascript
// Step 1: Import dependencies
import { UR, BytewordEncoding } from 'https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9';
import { LRUCache, debounce, handleError } from './shared.js';

// Step 2: Define class with state (following contracts/state-schema.md)
/**
 * @typedef {import('../specs/002-bc-ur-playground/contracts/state-schema.md').FormatConverterState} FormatConverterState
 */
class FormatConverter {
  constructor() {
    this.state = this.getInitialState();
    this.cache = new LRUCache(120);
    this.setupEventListeners();
  }
  
  // Step 3: Implement core methods using library
  async convertInput(input, targetFormat) {
    try {
      // Use UR.pipeline (never reimplement)
      const decoded = UR.pipeline.decode(input, { from: 'ur' });
      const hex = UR.pipeline.encode(decoded, { until: 'hex' });
      // ... rest of conversion
    } catch (error) {
      handleError(error, 'conversion', this.errorElement);
    }
  }
}

// Step 4: Export and initialize
export const converter = new FormatConverter();
```

### 3. Testing Manually

**Browser DevTools workflow**:

1. **Console validation**:
   ```javascript
   // Check state
   converter.state
   
   // Test conversion
   converter.convertInput('ur:crypto-seed/oeadgd...', 'hex')
   
   // Inspect cache
   converter.cache.cache
   ```

2. **Network tab** (verify CDN imports):
   - All imports return 200 status
   - Correct versions loaded
   - No CORS errors

3. **Performance tab**:
   - Conversion < 500ms for ≤10KB payloads
   - No long tasks blocking main thread

4. **Mobile testing** (camera):
   - Open on mobile device over local network
   - Grant camera permission
   - Verify QR scanning works

### 4. Example Data Buttons

Each tab includes "Load Example" buttons for quick testing:

```javascript
// converter.js
function loadExampleUR() {
  const exampleUR = 'ur:crypto-seed/oeadgdaebddemjyjsjtmwguaylwdcaemkbntthdrkmefwaocksktdenehylnyazstbsnfgpsdkpyti';
  document.getElementById('input').value = exampleUR;
  converter.performConversion();
}
```

**Example data** (from `reference_projects/bc-ur/tests/`):
- Single UR: crypto-seed, crypto-hdkey, crypto-psbt
- Multi-part UR: Large PSBT (15+ fragments)
- Bytewords: Minimal and standard styles
- Hex: Valid CBOR-encoded payloads

---

## Key Implementation Patterns

### 1. Trust the Library (Constitution Principle I)

✅ **DO**:
```javascript
// Use UR.pipeline
const hex = UR.pipeline.encode(data, { until: 'hex' });
const decoded = UR.pipeline.decode(input, { from: 'ur' });

// Use UrFountainEncoder
const encoder = new UrFountainEncoder(ur, maxLen, minLen, firstSeq);
const fragments = encoder.getAllPartsUr(0); // 0 = pure fragments

// Use UrFountainDecoder
const decoder = new UrFountainDecoder();
decoder.receivePartUr(fragment);
if (decoder.isComplete()) {
  const assembledUR = decoder.resultUr.toString();
}

// Generate QR codes (qrcode library)
import QRCode from 'https://esm.sh/qrcode@1.5.3';
await QRCode.toCanvas(canvas, urPart, {
  width: 400,
  errorCorrectionLevel: 'L',
  mode: 'alphanumeric' // Bytewords-optimized
});

// Scan QR codes (qr-scanner library)
import QrScanner from 'https://esm.sh/qr-scanner@1.4.2';
const scanner = new QrScanner(video, result => {
  decoder.receivePartUr(result.data);
}, { returnDetailedScanResult: true });
await scanner.start();
```

❌ **DON'T**:
```javascript
// Manual CBOR encoding (WRONG)
function manualEncodeCBOR(data) {
  // ... custom implementation
}

// Manual fountain encoding (WRONG)
function createMultiPartUR(ur, fragmentSize) {
  // ... reimplementation
}

// Manual QR generation (WRONG - use qrcode library)
function drawQRCode(canvas, data) {
  // ... custom QR rendering
}
```

### 2. Error Handling (Constitution Principle IV)

✅ **DO**:
```javascript
try {
  const result = UR.pipeline.decode(input, { from: 'hex' });
} catch (error) {
  // User-facing message with context
  updateStatus(`Invalid hex: ${error.message}`, 'error');
  
  // Console error for debugging
  console.error('[hex-parse] Conversion failed:', {
    input: input.substring(0, 50) + '...',
    error: error.message,
    stack: error.stack
  });
}
```

❌ **DON'T**:
```javascript
// Silent failure (WRONG)
try {
  decode(input);
} catch (e) {
  // No user feedback
}

// Generic error (WRONG)
catch (error) {
  alert('Error'); // Not contextual
}
```

### 3. State Management (No Framework)

✅ **DO**:
```javascript
// Explicit state updates
this.state.input.raw = newValue;
this.state.ui.isProcessing = true;
this.render();

// Hash routing
window.location.hash = '#multi-ur';

// sessionStorage for cross-tab
sessionStorage.setItem('forward-scanner', JSON.stringify(data));
```

❌ **DON'T**:
```javascript
// External state library (WRONG - violates simplicity)
import { createStore } from 'redux';

// Global mutable state (WRONG - hard to debug)
let globalUR = null;
```

---

## Debugging Tips

### 1. Console Playground

Open browser DevTools console:

```javascript
// Access decoded Registry Items (Tab 1 - Converter)
window.$lastRegistryItem           // Typed class instance (e.g., DetailedAccount)
window.$lastRegistryItem.encode()  // Returns UR string
window.$lastRegistryItem.getCbor() // Returns CBOR bytes
window.$lastDecoded                // Raw CBOR DataItem (always available)

// Access window.registryPlayground (Tab 4 - Registry)
window.registryPlayground.createItem('crypto-seed', {
  // ... seed data
});

// Check fountain decoder state (Tab 3 - Scanner)
decoder.decodedBlocks // [true, true, false, ...]
decoder.getProgress() // 0.666...

// Inspect conversion cache (Tab 1 - Converter)
converter.cache.cache // Map of cached results

// Check registry package loading
import { getPackageInfo } from './js/registry-loader.js';
getPackageInfo('sync') // { loaded: true, loadedAt: timestamp, ... }
```

### 2. Registry Item Inspection

When decoding a registered UR type (e.g., `ur:detailed-account/...`):

**Expandable Tree View** (in UI):
```
DetailedAccount {
  ▶ masterFingerprint: Uint8Array(33)
  ▶ outputDescriptors: Array(1)
  ▶ device: "Ngrave ZERO"
}

Methods:
  encode()        [common]
  getCbor()       [common]
  toDataItem()    [common]
  [Show type-specific methods] ← click to expand
```

**Console Interaction**:
```javascript
// After decoding detailed-account
const item = window.$lastRegistryItem;

// Re-encode to UR
const urString = item.encode();
console.log(urString); // "ur:detailed-account/..."

// Get CBOR hex
const cbor = item.getCbor();
console.log(cbor.toString('hex'));

// Compare with raw CBOR
const raw = window.$lastDecoded;
console.log(raw); // DataItem with tag/value structure
```

### 2. Visual Pipeline Debugging

Pipeline visualization shows conversion flow:

```
multiur → ur → bytewords → hex → decoded → registry-item
  (gray)  (green)  (gray)  (green)  (gray)    (green)

Legend:
- Green: Active/success
- Red: Error (with message)
- Gray: Inactive
- Arrows: Conversion direction (→ forward, ← reverse)
```

**Registry Item Decoding** (when type is registered):
```
hex → decoded → registry-item
      (green)     (green)

Output view: "Registry Item" selected
Shows: Expandable tree + methods + console hint
```

### 3. Network Panel

Monitor dynamic imports:

```
GET https://esm.sh/@ngraveio/bc-ur@2.0.0-beta.9 - 200 OK
GET https://esm.sh/@ngraveio/ur-sync@latest - 200 OK
GET https://esm.sh/qr-scanner@1.4.2 - 200 OK
```

If 404 errors: check version pinning in imports.

### 4. Mobile Camera Issues

If camera not working:

1. **Check HTTPS**: Camera API requires secure context
2. **Check permissions**: Browser settings → Site settings → Camera
3. **Check DevTools** (mobile): Chrome remote debugging or Safari Web Inspector
4. **Console errors**: Look for `getUserMedia` errors

---

## Performance Benchmarks

### Conversion Performance

Target: <500ms for ≤10KB payloads

```javascript
// Measure conversion time
console.time('conversion');
const result = converter.convertInput(largeUR, 'hex');
console.timeEnd('conversion'); // Should log <500ms
```

### QR Generation Performance

Target: <2s for ≤50 parts

```javascript
// Measure QR generation
console.time('qr-generation');
const frames = multiURGenerator.generateQRFrames(fragments);
console.timeEnd('qr-generation'); // Should log <2000ms
```

### Animation Performance

Target: Maintain framerate ±1fps

```javascript
// Monitor animation FPS
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`); // Should match qrSettings.frameRate ±1
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(measureFPS);
}
measureFPS();
```

---

## Next Steps

After completing quickstart:

1. **Implement Tab 1 (Converter)**: Follow `js/converter.js` structure
2. **Implement Tab 2 (Multi-UR)**: Reference `research.md` QR patterns
3. **Implement Tab 3 (Scanner)**: Use `UrFountainDecoder` patterns
4. **Implement Tab 4 (Registry)**: Dynamic loading from `registry-loader.js`

**Constitution reminders**:
- ✅ Trust the library (use bc-ur methods, don't reimplement)
- ✅ Client-first (no backend calls)
- ✅ Simplicity (no frameworks unless justified)
- ✅ Explicit errors (user-visible messages with context)
- ✅ Fast feedback (debounce inputs, cache results)
- ✅ Reference authority (consult `reference_projects/` before implementing)
- ✅ Inspectable (DevTools-friendly state)

Ready to code! 🚀
