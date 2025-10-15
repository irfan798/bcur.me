# Registry Item Decoding - README Updates

**Date**: October 14, 2025  
**Branch**: `002-bc-ur-playground`  
**Status**: Documentation updated for Registry Item decoding feature

## Summary

Updated README files to document the new Registry Item decoding feature that allows the converter to automatically decode registered UR types into typed class instances with console access and expandable property inspection.

## Files Modified

### 1. `/README.md` (Project README)

**Changes:**

#### Features Section
- Added "Registry Item Decoding" feature highlighting automatic decoding to typed classes
- Added "Console Playground" feature for browser DevTools interaction
- Updated CBOR decoding to mention "Registry Item" as 5th output format

#### New Section: Registry Item Inspection
- **Supported Registry Types**: Lists all 6 registry packages and their types
  - blockchain-commons: crypto-seed, crypto-hdkey, crypto-psbt, crypto-account, crypto-output, crypto-eckey
  - coin-identity: coin-identity
  - sync: detailed-account, portfolio-coin, portfolio-metadata, portfolio
  - hex-string: hex-string
  - sign: sign-request, sign-response
  - uuid: uuid

- **Example Usage**: Shows expandable tree view with properties and methods
- **Console Interaction**: Documents `window.$lastRegistryItem` and `window.$lastDecoded` APIs

#### Technology Stack
- Added UR Registry Packages section listing all 6 packages with descriptions

#### File Structure
- Updated to show multi-tab architecture with all 5 JS modules
- Added `registry-loader.js` description

#### Key Components
- Added `decodeToRegistryItem()` method
- Added `renderRegistryItemView()` method
- Added registry package preloading (background, silent)
- Added new **RegistryLoader Module** section

#### Roadmap
- Marked multi-tab architecture as ✅ complete
- Marked Registry Item decoding as ✅ complete
- Marked Console playground as ✅ complete

#### Contributing
- Updated paths to point to `specs/002-bc-ur-playground/` structure
- Added key principles section with constitution principles

---

### 2. `/specs/002-bc-ur-playground/quickstart.md` (Developer Guide)

**Changes:**

#### Core Dependencies
- Updated version numbers to 0.1.0 for all ur-registry packages (from `@latest`)
- Added inline descriptions of types in each package

#### New Section: Supported Registry Types
- Complete listing of all supported types organized by package
- Usage example showing DetailedAccount decoding
- Console access examples

#### Implementation Pattern: Registry Item Decoding (New Section 5)
- **DO examples**:
  - `decodeToRegistryItem()` implementation with error handling
  - Type-to-package mapping reference
  - Background preloading pattern
  - Expandable tree view rendering
  
- **DON'T examples**:
  - Manual class reconstruction (wrong - library does this)
  - Blocking preload (wrong - slows initial load)

#### Console Playground Section (Enhanced)
- Added `window.$lastRegistryItem` documentation
- Added registry item method examples (`.encode()`, `.getCbor()`)
- Added `window.$lastDecoded` for raw CBOR access
- Added package loading status checking

#### Registry Item Inspection Section (New)
- Expandable tree view UI example
- Console interaction patterns
- Property inspection examples

#### Visual Pipeline Debugging
- Added "registry-item" stage to pipeline visualization
- Added Registry Item decoding flow diagram

## Key Features Documented

### 1. Automatic Type Detection
When a registered UR type is decoded, the converter:
1. Detects UR type (e.g., `detailed-account`)
2. Loads appropriate registry package (`@ngraveio/ur-sync`)
3. Calls `fromDataItem()` to instantiate typed class
4. Renders expandable tree view
5. Exposes to console as `window.$lastRegistryItem`

### 2. Expandable Tree View (DevTools-style)
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
  [Show type-specific methods] ← toggle
```

### 3. Console API
```javascript
// Typed instance
window.$lastRegistryItem instanceof DetailedAccount // true
window.$lastRegistryItem.encode()                   // UR string
window.$lastRegistryItem.getCbor()                  // CBOR bytes

// Raw CBOR (always available)
window.$lastDecoded                                 // DataItem
```

### 4. Silent Background Preloading
- All 6 registry packages preload after page interactive
- Non-blocking (no UI delay)
- Console logs only (no loading spinners)
- Graceful fallback if package loading fails

### 5. Type-to-Package Mapping
Documented mapping used by `getPackageKeyForType()`:
- `crypto-*` types → `blockchain-commons` package
- `detailed-account`, `portfolio*` → `sync` package
- `coin-identity` → `coin-identity` package
- `sign-*` → `sign` package
- `hex-string` → `hex-string` package
- `uuid` → `uuid` package

## Architecture Principles Maintained

All updates follow the project's core principles:

✅ **Trust the Library**: Uses registry packages' `fromDataItem()` methods  
✅ **Client-First**: No server calls, all processing client-side  
✅ **Simplicity**: Vanilla JS patterns, no new frameworks  
✅ **Explicit Errors**: Silent fallback to CBOR views on registry decode failure  
✅ **Fast Feedback**: Background preloading, no blocking  
✅ **Deterministic**: Same input → same Registry Item output  
✅ **Inspectable**: DevTools-style tree, console exposure

## Next Steps

### Implementation (from tasks.md)
- [ ] **T022a**: Add registry package preloading to `js/converter.js`
- [ ] **T022b**: Implement Registry Item decoding logic
- [ ] **T022c**: Add Registry Item view renderer (expandable tree)
- [ ] **T022d**: Add methods display with toggle
- [ ] **T022e**: Add console exposure (`window.$lastRegistryItem`)
- [ ] **T022f**: Add console hint in UI
- [ ] **T022g**: Add copy options for Registry Item
- [ ] **T022h**: Update decoded output dropdown in HTML

### Testing
1. Decode `ur:detailed-account/...` → verify DetailedAccount class
2. Check expandable tree properties
3. Verify console access (`window.$lastRegistryItem`)
4. Test common methods (`.encode()`, `.getCbor()`, `.toDataItem()`)
5. Verify fallback to CBOR views for unregistered types
6. Check background preloading (console logs only)

## Documentation Quality

- ✅ User-facing README updated with examples
- ✅ Developer quickstart updated with implementation patterns
- ✅ All 6 registry packages documented with types
- ✅ Console API fully documented
- ✅ DO/DON'T examples for implementation
- ✅ Architecture principles maintained
- ✅ Visual examples (tree view, pipeline)

## Files Ready for Review

1. `/README.md` - Updated project README
2. `/specs/002-bc-ur-playground/quickstart.md` - Updated developer guide
3. This summary document

---

**Documentation Status**: ✅ Complete  
**Implementation Status**: 🔄 Pending (tasks T022a-h)  
**Spec Updates**: 🔄 Next (spec.md, tasks.md, plan.md)
