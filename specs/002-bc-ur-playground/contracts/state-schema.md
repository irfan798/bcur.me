# State Contracts: BC-UR Playground

**Feature**: BC-UR Playground | **Type**: Internal State Contracts | **Date**: 2025-10-08

## Overview

This document defines TypeScript-style interfaces for internal state management. Since this is a vanilla JavaScript project (no TypeScript compilation), these serve as documentation contracts for developers and are enforced via JSDoc comments in source code.

---

## Tab 1: Format Converter State

### FormatConverter Class State

```typescript
interface FormatConverterState {
  // Input state
  input: {
    raw: string;                          // User input text
    detectedFormat: InputFormat | null;   // Auto-detected format
    manualOverride: InputFormat | null;   // User-selected format
  };
  
  // Conversion state
  conversion: {
    sourceFormat: InputFormat;            // Resolved input format
    targetFormat: OutputFormat;           // Selected output format
    urTypeOverride: string | null;        // Manual UR type (validated pattern)
    bytewordsStyles: {
      input: 'minimal' | 'standard' | 'uri';
      output: 'minimal' | 'standard' | 'uri';
    };
  };
  
  // Results
  results: {
    ur: string | null;
    hex: string | null;
    bytewords: {
      minimal: string | null;
      standard: string | null;
      uri: string | null;
    };
    decoded: {
      json: string | null;
      diagnostic: string | null;
      commented: string | null;
      javascript: string | null;
    };
  };
  
  // UI state
  ui: {
    pipelineStages: PipelineStage[];      // Visual pipeline state
    errorMessage: string | null;
    isProcessing: boolean;
    urTypeHint: {
      detected: string | null;
      isRegistered: boolean;
      registryPackage: string | null;
    };
  };
  
  // Cache reference
  cache: LRUCache;                         // Conversion result cache
}

type InputFormat = 
  | 'multiur'      // Multi-part UR (newlines + ur: or /\d+of\d+/)
  | 'ur'           // Single UR (ur: prefix)
  | 'hex'          // Hex string (even-length, [0-9a-fA-F]+)
  | 'bytewords'    // Bytewords (4-letter or 2-char pairs)
  | 'decoded-json' // JSON object (manual selection only)
  | null;

type OutputFormat = 
  | 'ur'
  | 'hex'
  | 'bytewords-minimal'
  | 'bytewords-standard'
  | 'bytewords-uri'
  | 'decoded-json'
  | 'decoded-diagnostic'
  | 'decoded-commented'
  | 'decoded-javascript';

interface PipelineStage {
  name: string;                            // e.g., "multiur", "ur", "bytewords", "hex", "decoded"
  status: 'active' | 'success' | 'error' | 'inactive';
  direction: 'forward' | 'reverse' | null; // Arrow direction in visualization
  errorMessage: string | null;
}
```

### Conversion Cache Contract

```typescript
interface CacheEntry {
  key: string;                             // Composite key: input|format|output|urType|styles
  value: ConversionResult;
  timestamp: number;                       // For LRU ordering
}

interface ConversionResult {
  ur: string | null;
  hex: string | null;
  bytewords: Record<'minimal' | 'standard' | 'uri', string | null>;
  decoded: Record<'json' | 'diagnostic' | 'commented' | 'javascript', string | null>;
  urType: string | null;
  metadata: {
    conversionTime: number;                // Milliseconds
    cacheHit: boolean;
  };
}
```

---

## Tab 2: Multi-UR Generator State

### MultiURGenerator Class State

```typescript
interface MultiURGeneratorState {
  // Input
  input: {
    ur: string | null;                     // Single UR (from converter or manual)
    hex: string | null;                    // Alternative hex input
    source: 'forwarded' | 'manual';
  };
  
  // Encoder configuration
  encoderParams: {
    maxFragmentLength: number;             // 10-200, default 100
    minFragmentLength: number;             // 5-50, default 10
    firstSeqNum: number;                   // Default 0
    repeatAfterRatio: number;              // 0=infinite, default 2
  };
  
  // QR settings
  qrSettings: {
    size: number;                          // 200-800px, default 400
    errorCorrection: 'L' | 'M' | 'Q' | 'H'; // Default 'L'
    frameRate: number;                     // 1-30 fps, default 5
  };
  
  // Generated output
  output: {
    fragments: string[];                   // Multi-part UR strings
    isInfinite: boolean;                   // repeatAfterRatio === 0
    totalFragments: number;
    estimatedScanTime: number;             // seconds
  };
  
  // Animation state
  animation: {
    isPlaying: boolean;
    isPaused: boolean;
    currentFrameIndex: number;             // 0-based
    animationId: number | null;            // requestAnimationFrame ID
    lastFrameTime: number;                 // Timestamp
    qrFrames: QRFrame[];                   // Pre-generated QR images
  };
  
  // UI state
  ui: {
    showStreamingPreview: boolean;         // True when infinite
    currentPartIndicator: string;          // e.g., "Part 3 of 15"
    isGenerating: boolean;
    errorMessage: string | null;
    downloadsEnabled: boolean;             // False when infinite
  };
}

interface QRFrame {
  partIndex: number;
  totalParts: number;
  urString: string;
  qrDataURL: string;                       // Canvas toDataURL() result
  settings: {
    size: number;
    ecLevel: 'L' | 'M' | 'Q' | 'H';
    mode: 'alphanumeric';
  };
}
```

---

## Tab 3: QR Scanner State

### QRScanner Class State

```typescript
interface QRScannerState {
  // Camera state
  camera: {
    isActive: boolean;
    hasPermission: boolean | null;         // null=not requested, true=granted, false=denied
    stream: MediaStream | null;
    deviceId: string | null;               // Selected camera device
    hasTorch: boolean;                     // Torch/flashlight support
    isTorchOn: boolean;
  };
  
  // Decoder state (from UrFountainDecoder)
  decoder: {
    instance: UrFountainDecoder | null;
    seenBlocks: boolean[];                 // Scanned fragments (may include redundant)
    decodedBlocks: boolean[];              // Original blocks resolved
    expectedBlockCount: number;
    progress: number;                      // 0.0-1.0
    urType: string | null;
    isComplete: boolean;
    assembledUR: string | null;
  };
  
  // Scan state
  scanning: {
    isScanning: boolean;
    lastScanTime: number;
    totalScans: number;                    // Count of QR codes detected
    uniqueFragments: number;               // Unique UR parts received
    scanStartTime: number | null;
    estimatedTimeRemaining: number | null; // Seconds
  };
  
  // UI state
  ui: {
    videoPreview: HTMLVideoElement | null;
    blocksGrid: HTMLElement | null;
    progressBar: HTMLElement | null;
    errorMessage: string | null;
    showTroubleshooting: boolean;          // True if no QR detected after 10s
    typeMismatchWarning: {
      detected: string | null;
      expected: string | null;
    } | null;
  };
}

interface DecodedBlock {
  index: number;
  isDecoded: boolean;                      // From decoder.decodedBlocks[index]
  seenCount: number;                       // How many times fragment scanned
}
```

---

## Tab 4: Registry Browser State

### RegistryBrowser Class State

```typescript
interface RegistryBrowserState {
  // Registry data
  registry: {
    packages: RegistryPackage[];
    types: RegistryType[];
    loadedPackages: Set<string>;           // Package keys that are loaded
  };
  
  // UI state
  ui: {
    expandedTypes: Set<string>;            // UR type names with expanded CDDL
    searchQuery: string;
    filterPackage: string | null;
    selectedType: RegistryType | null;
  };
  
  // Console playground state
  playground: {
    instances: Map<string, RegistryItem>;  // Created instances by ID
    lastCreatedId: string | null;
  };
}

interface RegistryPackage {
  key: 'blockchain-commons' | 'coin-identity' | 'sync' | 'hex-string' | 'sign' | 'uuid';
  npmName: string;                         // e.g., "@ngraveio/ur-blockchain-commons"
  isLoaded: boolean;
  types: RegistryType[];
}

interface RegistryType {
  tag: number;                             // CBOR tag
  urType: string;                          // e.g., "crypto-seed"
  package: string;                         // Package key
  cddl: string | null;                     // CDDL schema
  description: string | null;
  docLink: string | null;
}

interface RegistryItem {
  id: string;                              // UUID
  type: RegistryType;
  data: Record<string, any>;               // JavaScript object
  encoded: {
    cbor: string;                          // Hex
    ur: string;
    bytewords: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
  };
  metadata: {
    createdAt: number;
    source: 'console' | 'decoded';
  };
}
```

---

## Cross-Tab Shared State

### Router State

```typescript
interface RouterState {
  currentTab: 'converter' | 'multi-ur' | 'scanner' | 'registry';
  previousTab: string | null;
  forwardedData: SessionTransferPayload | null;
}

interface SessionTransferPayload {
  sourceTab: 'converter' | 'multi-ur' | 'scanner' | 'registry';
  targetTab: 'converter' | 'multi-ur' | 'scanner' | 'registry';
  dataType: 'ur' | 'multi-ur' | 'registry-type';
  payload: any;                            // Tab-specific structure
  timestamp: number;
  ttl: number;                             // Milliseconds
}
```

### Global Application State

```typescript
interface AppState {
  // Tab instances
  tabs: {
    converter: FormatConverter | null;
    multiUR: MultiURGenerator | null;
    scanner: QRScanner | null;
    registry: RegistryBrowser | null;
  };
  
  // Shared utilities
  shared: {
    cache: LRUCache;                       // Global conversion cache
    registryLoader: RegistryLoader;
    errorHandler: ErrorHandler;
  };
  
  // Runtime state
  runtime: {
    isOnline: boolean;
    isMobile: boolean;
    hasCamera: boolean;
    browserInfo: {
      name: string;
      version: string;
      isSupported: boolean;
    };
  };
}
```

---

## Validation Contracts

### Input Validation Functions

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Example validation function signatures (implemented in shared.js)
function validateHexInput(hex: string): ValidationResult;
function validateURType(type: string): ValidationResult;
function validateFountainParams(params: {
  maxFragmentLength: number;
  minFragmentLength: number;
  firstSeqNum: number;
  repeatAfterRatio: number;
}): ValidationResult;
function validateQRSettings(settings: {
  size: number;
  errorCorrection: string;
  frameRate: number;
}): ValidationResult;
```

---

## Event Contracts

### Custom Events

```typescript
// Dispatched when conversion completes
interface ConversionCompleteEvent extends CustomEvent {
  detail: {
    result: ConversionResult;
    cacheHit: boolean;
    duration: number;
  };
}

// Dispatched when fountain decoder progress updates
interface DecoderProgressEvent extends CustomEvent {
  detail: {
    progress: number;                      // 0.0-1.0
    decodedBlocks: boolean[];
    expectedBlockCount: number;
    isComplete: boolean;
  };
}

// Dispatched when tab navigation occurs
interface TabChangeEvent extends CustomEvent {
  detail: {
    from: string;
    to: string;
    forwardedData: SessionTransferPayload | null;
  };
}

// Dispatched when registry package loaded
interface PackageLoadedEvent extends CustomEvent {
  detail: {
    packageKey: string;
    types: RegistryType[];
    loadTime: number;
  };
}
```

---

## Error Contracts

### Error Categories

```typescript
interface AppError {
  category: ErrorCategory;
  stage: string;                           // Pipeline stage or feature name
  message: string;                         // User-facing message
  technicalDetails: string;                // Console-logged details
  stack: string;                           // Stack trace (development only)
  timestamp: number;
}

type ErrorCategory = 
  | 'parse'              // Invalid input format
  | 'validation'         // Failed validation rules
  | 'assembly'           // Multi-part UR assembly error
  | 'encoding'           // Library encoding/decoding error
  | 'system'             // Camera, permissions, browser API
  | 'network'            // Dynamic import/CDN fetch (if applicable)
  | 'state';             // Invalid state transition

interface ErrorHandler {
  handle(error: Error, stage: string, uiElement?: HTMLElement): void;
  getContextualMessage(error: Error, stage: string): string;
  logToConsole(error: AppError): void;
}
```

---

## JSDoc Usage Pattern

All state-managing classes should use JSDoc comments referencing these contracts:

```javascript
/**
 * @typedef {import('./contracts/state-schema.md').FormatConverterState} FormatConverterState
 */

/**
 * Format Converter for BC-UR Playground
 * @class
 */
class FormatConverter {
  /**
   * @type {FormatConverterState}
   * @private
   */
  state;
  
  constructor() {
    this.state = this.getInitialState();
  }
  
  /**
   * @returns {FormatConverterState}
   * @private
   */
  getInitialState() {
    return {
      input: { raw: '', detectedFormat: null, manualOverride: null },
      // ... rest of initial state
    };
  }
}
```

---

## Contract Enforcement

Since this is vanilla JS (no TypeScript compiler), contracts are enforced via:

1. **JSDoc comments**: IDE autocomplete and type hints
2. **Manual validation**: `validateFountainParams()` etc.
3. **Console warnings**: Log type mismatches in development
4. **Code review**: Verify state updates match contracts

**No runtime type checking libraries** (violates constitution's simplicity principle).

All state contracts defined. Ready for quickstart.md generation.
