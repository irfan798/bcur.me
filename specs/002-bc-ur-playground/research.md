# Research: BC-UR Playground

**Feature**: BC-UR Playground | **Phase**: 0 (Outline & Research) | **Date**: 2025-10-08

## Overview

This document resolves technical unknowns and documents integration patterns for the BC-UR Playground feature. All decisions align with constitution principles: trust the library, client-first architecture, simplicity over abstractions.

## Research Tasks


### 2. QR Code Library Integration

**Decision**: Use separate libraries - `qrcode` for generation, `qr-scanner` for scanning

**Rationale**:
- **Generation**: `qrcode@1.5.3` - Canvas-based rendering, explicit alphanumeric mode, 10KB gzipped
- **Scanning**: `qr-scanner@1.4.2` - Best-in-class decoder, Web Worker support, 16KB gzipped
- Best-of-breed approach: each library optimized for its function
- Combined footprint (~26KB) smaller than unified alternatives (html5-qrcode ~80KB)
- Both ESM-first with native import support
- Active maintenance + mobile browser support

**Integration Pattern**:
```javascript
// multi-ur.js - Generation with qrcode
import QRCode from 'https://esm.sh/qrcode@1.5.3';

async function generateQRFrame(urPart, settings) {
  const canvas = document.getElementById('qr-canvas');
  await QRCode.toCanvas(canvas, urPart, {
    width: settings.size,
    errorCorrectionLevel: settings.ecLevel,
    mode: 'alphanumeric' // Optimized for bytewords
  });
}

// scanner.js - Scanning with qr-scanner
import QrScanner from 'https://esm.sh/qr-scanner@1.4.2';

const scanner = new QrScanner(videoElement, result => {
  decoder.receivePartUr(result.data);
  updateProgress();
}, { returnDetailedScanResult: true });
await scanner.start();
```

**Alternatives Considered**:
- qr-scanner only: Rejected (no generation capabilities - library is scan-only)
- html5-qrcode: Rejected (larger bundle ~80KB, less optimized for each function)
- qr-code-generator + jsQR: Rejected (qrcode has better canvas API, qr-scanner superior to jsQR)

---

### 3. Fountain Decoder Progress Visualization

**Decision**: Use `UrFountainDecoder.decodedBlocks` bitmap for grid visualization

**Rationale**:
- Library exposes `decodedBlocks` as boolean array (1=decoded, 0=pending)
- Matches fountain decoding semantics (original blocks, not seen fragments)
- Avoids misleading progress from redundant fountain fragments
- Aligns with spec requirement FR-025: "grid derived from decoder.decodedBlocks"
- Constitution principle: trust the library (use provided state, don't infer)

**Implementation Pattern**:
```javascript
// scanner.js
function updateDecodedBlocksGrid(decoder) {
  const decodedBlocks = decoder.decodedBlocks; // boolean array from library
  const grid = document.getElementById('blocks-grid');
  
  decodedBlocks.forEach((isDecoded, index) => {
    const block = grid.children[index];
    block.className = isDecoded ? 'block decoded' : 'block pending';
  });
  
  const progress = decoder.getProgress(); // 0.0 to 1.0
  document.getElementById('progress-text').textContent = 
    `${(progress * 100).toFixed(1)}% (${decoder.decodedBlocks.filter(b => b).length}/${decoder.expectedBlockCount})`;
}
```

**Alternatives Considered**:
- Track seen fragments manually: Rejected (reimplements library logic, violates "trust the library")
- Use library's internal state directly: Rejected (not exposed in public API)
- Calculate progress from total scans: Rejected (misleading with fountain codes - infinite redundancy possible)

---

### 4. Cross-Tab State Management

**Decision**: Hash parameters + sessionStorage with explicit cleanup

**Rationale**:
- Hash routing enables deep linking (shareable URLs for tab state)
- sessionStorage provides temporary cross-tab data without persistence
- Explicit cleanup on page unload preserves privacy (constitution principle)
- No external state management library needed (simplicity principle)

**Implementation Pattern**:
```javascript
// router.js
export function forwardToTab(tab, data) {
  const encoded = btoa(JSON.stringify(data)); // Base64 encode for URL safety
  sessionStorage.setItem(`forward-${tab}`, JSON.stringify(data));
  window.location.hash = `#${tab}?data=${encoded}`;
}

export function receiveForwardedData(tab) {
  const urlData = new URLSearchParams(window.location.hash.split('?')[1]).get('data');
  const sessionData = sessionStorage.getItem(`forward-${tab}`);
  sessionStorage.removeItem(`forward-${tab}`); // Cleanup after read
  
  return urlData ? JSON.parse(atob(urlData)) : (sessionData ? JSON.parse(sessionData) : null);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  sessionStorage.clear(); // Constitution: clear temporary state on unload
});
```

**Alternatives Considered**:
- localStorage: Rejected (violates "no persistent storage" constraint)
- postMessage API: Rejected (requires multiple windows, not tabs)
- Redux/Zustand: Rejected (violates "no UI framework unless justified" requirement)

---

### 5. Conversion Caching Strategy

**Decision**: LRU Map with composite key (input + format + options)

**Rationale**:
- Native JavaScript Map (no library dependency)
- LRU eviction prevents unbounded memory growth
- Composite key captures all conversion parameters (deterministic cache hits)
- Spec requirement FR-009: "120 entries, LRU eviction"

**Implementation Pattern**:
```javascript
// shared.js
export class LRUCache {
  constructor(maxSize = 120) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  generateKey(input, detectedFormat, outputFormat, urType, styles) {
    return [input, detectedFormat, outputFormat, urType, JSON.stringify(styles)].join('|');
  }
  
  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // Move to end (most recent)
    return value;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey); // Evict oldest
    }
    this.cache.set(key, value);
  }
}
```

**Alternatives Considered**:
- WeakMap: Rejected (cannot use string keys)
- IndexedDB: Rejected (async API adds complexity, persistence violates constitution)
- External caching library: Rejected (simple Map sufficient, avoids dependency)

---

### 6. Error Boundary Pattern (No Framework)

**Decision**: Centralized error handler with contextual UI updates

**Rationale**:
- No React-style error boundaries (no framework per user requirement)
- Explicit try/catch with user-visible messages (constitution principle IV)
- Pipeline stage awareness for contextual errors
- Console errors preserved for debugging

**Implementation Pattern**:
```javascript
// shared.js
export function handleConversionError(error, stage, uiElement) {
  const contextualMessage = getContextualError(error, stage);
  
  // UI feedback (constitution: explicit errors)
  uiElement.classList.add('error');
  uiElement.querySelector('.error-message').textContent = contextualMessage;
  
  // Console logging (constitution: preserve for debugging)
  console.error(`[${stage}] Conversion failed:`, {
    stage,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}

function getContextualError(error, stage) {
  const errorMap = {
    'hex-parse': (e) => e.message.includes('odd') ? 'Invalid hex: odd length' : 'Invalid hex format',
    'ur-decode': (e) => `UR decoding failed: ${e.message}`,
    'fountain-assembly': (e) => `Multi-part assembly incomplete: ${e.message}`,
    'cbor-parse': (e) => `CBOR decode failed: ${e.message}`
  };
  
  return errorMap[stage] ? errorMap[stage](error) : `Error in ${stage}: ${error.message}`;
}
```

**Alternatives Considered**:
- Global error handler only: Rejected (loses stage context)
- Error boundary library: Rejected (no framework requirement)
- Silent error suppression: Rejected (violates constitution principle IV)

---

## Best Practices Summary

### bc-ur Library Integration
- **Always use library methods**: `UR.pipeline.encode()`, `UR.pipeline.decode()`, never manual CBOR
- **Fountain encoding**: `UrFountainEncoder.getAllPartsUr()` for deterministic generation
- **Fountain decoding**: `UrFountainDecoder.receivePartUr()` + `getProgress()` for state tracking
- **Bytewords styles**: `BytewordEncoding` with explicit style ('minimal', 'standard', 'uri')

### ur-registry Integration
- **Dynamic loading**: Import registry packages on-demand (lazy loading per tab/type)
- **Type detection**: Use `decoded.toUr()` for auto-detection, manual override with validation
- **Registry lookup**: Match decoded UR type against loaded registry packages
- **Console playground**: Expose `window.registryPlayground` for developer experimentation

### QR Code Patterns
- **Generation**: `qrcode@1.5.3` with alphanumeric mode (bytewords-optimized canvas rendering)
- **Scanning**: `qr-scanner@1.4.2` with MediaDevices API for frame-by-frame processing
- **Animation**: Canvas rendering with requestAnimationFrame for smooth playback
- **Performance**: Debounce QR generation (avoid regenerating on every input change)
- **Two libraries rationale**: Best-in-class for each function, combined 26KB vs 80KB unified alternatives

### Performance Optimization
- **Debouncing**: 150ms for typing, 10ms for paste events
- **Caching**: LRU Map with composite keys (input + format + options)
- **Lazy loading**: Dynamic imports for registry packages, tab content
- **Chunking**: Large UR processing in chunks (avoid main thread blocking >500ms)

---

## Open Questions Resolved

1. **Q: How to handle infinite repeatAfterRatio (0) in multi-UR generator?**
   - A: Disable downloads, show streaming preview synchronized with animation (clarified in spec)

2. **Q: Which QR libraries for generation and scanning?**
   - A: `qrcode@1.5.3` (generation) + `qr-scanner@1.4.2` (scanning) - best-in-class for each function

3. **Q: How to visualize fountain decoder progress?**
   - A: Use `UrFountainDecoder.decodedBlocks` bitmap (library-provided state)

4. **Q: State management pattern without framework?**
   - A: Hash routing + sessionStorage with explicit cleanup (constitution-compliant)

All research tasks complete. Ready for Phase 1 (Design & Contracts).
