# BC-UR Build Fix Task

**Date**: 2025-10-10  
**Package**: `@ngraveio/bc-ur@2.0.0-beta.9`  
**Issue**: ESM build broken for browser environments  
**Severity**: Critical - blocks browser usage of local package

---

## 🔴 Problem Summary

The bc-ur package has a **build bug** that breaks ESM usage in browsers. The package attempts to avoid the "Dual Package Hazard" by having both ESM and CommonJS use a shared bundled CBOR2 library, but the implementation is broken for browsers.

### Root Cause

1. **ESM version incorrectly references CommonJS files**:
   - `/dist/esm/wrappers/cbor2.js` imports from `../../commonjs/wrappers/cbor2Wrapper.js`
   - Browsers cannot load CommonJS modules as ES modules
   - This causes: `The requested module '../../commonjs/wrappers/cbor2Wrapper.js' does not provide an export named 'decode'`

2. **ESM cbor2Wrapper.js missing bundled code**:
   - `/dist/esm/wrappers/cbor2Wrapper.js` imports bare specifiers: `import { decode } from 'cbor2'`
   - Should contain bundled CBOR2 code (like CommonJS version does)
   - CommonJS version: 49 lines with bundled code
   - ESM version: 5 lines with external imports (broken!)

3. **The correct code is commented out**:
   ```javascript
   // In /dist/esm/wrappers/cbor2.js (line 6)
   export { decode, encode, Tag, registerEncoder, comment, diagnose } from "../../commonjs/wrappers/cbor2Wrapper.js";
   // export { decode, encode, Tag, registerEncoder } from "./cbor2Wrapper.js";  // ← SHOULD USE THIS!
   ```

---

## 📖 Understanding Dual Package Hazard

From [Node.js docs](https://nodejs.org/docs/latest-v18.x/api/packages.html#dual-package-hazard):

**The Problem**: When a package provides both ESM and CommonJS, and they import a shared dependency differently, you get **two instances** of that dependency in memory. This breaks singleton patterns, instanceof checks, and global state.

**Example**:
```javascript
// ESM version imports:
import { Tag } from 'cbor2';

// CommonJS version imports:
const { Tag } = require('cbor2');

// These are TWO DIFFERENT Tag classes!
// tag1 instanceof Tag !== tag2 instanceof Tag (even though both are Tags!)
```

**BC-UR's Intended Solution**:
Bundle CBOR2 into a single file that both ESM and CommonJS can share:
```
dist/
├── commonjs/
│   └── wrappers/
│       └── cbor2Wrapper.js  (bundled CBOR2 code - 49 lines)
└── esm/
    └── wrappers/
        ├── cbor2.js         (re-exports from cbor2Wrapper.js)
        └── cbor2Wrapper.js  (SHOULD have bundled code, but doesn't!)
```

**Why This Fails in Browsers**:
- Node.js can load CommonJS from ESM using `createRequire()` 
- Browsers **cannot** - they only support ES modules
- The ESM → CommonJS reference breaks in browsers

---

## ✅ Proper Fix (for bc-ur maintainers)

### Option 1: Separate Bundled Versions (Recommended)

**Change build process to**:
1. Bundle CBOR2 separately for ESM and CommonJS
2. Each version imports from its own bundled copy
3. No cross-references between dist/esm and dist/commonjs

**Files to change**:

1. `/dist/esm/wrappers/cbor2Wrapper.js`:
   ```javascript
   // INSTEAD OF: import { decode } from 'cbor2';
   // HAVE: (all the bundled CBOR2 code here, converted to ESM)
   
   const f$4 = {POS_INT:0, NEG_INT:1, BYTE_STRING:2, UTF8_STRING:3, ...};
   // ... (rest of bundled CBOR2 code)
   export const decode = ...;
   export const encode = ...;
   export const Tag = ...;
   // etc.
   ```

2. `/dist/esm/wrappers/cbor2.js`:
   ```javascript
   // Use the ESM bundled version in same directory
   export { decode, encode, Tag, registerEncoder, comment, diagnose } from "./cbor2Wrapper.js";
   ```

**Build script changes** (`rollup.config.mjs`):
```javascript
// Current: Only bundles for CommonJS
// Add: Also bundle for ESM

export default [
  {
    input: 'src/wrappers/cbor2Wrapper.ts',
    output: {
      file: 'dist/commonjs/wrappers/cbor2Wrapper.js',
      format: 'cjs'
    },
    plugins: [/* bundle cbor2 */]
  },
  {
    input: 'src/wrappers/cbor2Wrapper.ts',
    output: {
      file: 'dist/esm/wrappers/cbor2Wrapper.js',
      format: 'esm'  // ← ADD THIS
    },
    plugins: [/* bundle cbor2 */]
  }
]
```

**Result**:
- ✅ No Dual Package Hazard (both use bundled code, just different formats)
- ✅ Works in browsers (ESM only imports from ESM)
- ✅ Works in Node.js (both formats work independently)
- ✅ Maintains single source of truth (bundled CBOR2, just in two formats)

---

### Option 2: Use ESM cbor2 Without Bundling (Alternative)

**Question**: "If it just uses cbor2 ESM version without bundling in ESM build, would that solve it?"

**Answer**: **YES, but with caveats**:

**Pros**:
- ✅ Works in browsers (ESM → ESM imports work)
- ✅ Simpler build process (no bundling needed for ESM)
- ✅ Smaller bundle size (shared cbor2 dependency)

**Cons**:
- ❌ Dual Package Hazard **returns** if both ESM and CommonJS are used in same app
- ❌ Package users must install cbor2 as peer dependency
- ❌ Version conflicts possible (bc-ur expects cbor2@X, user has cbor2@Y)

**Implementation**:
```javascript
// dist/esm/wrappers/cbor2Wrapper.js
export { decode, encode, Tag, registerEncoder, comment, diagnose } from 'cbor2';
export { registerEncoder as originalRegisterEncoder } from 'cbor2/encoder';

// dist/commonjs/wrappers/cbor2Wrapper.js (keep bundled)
// ... bundled CBOR2 code as-is
```

**When to use**:
- If bc-ur is **only used in ESM environments** (browsers, modern Node)
- If you're okay with cbor2 as peer dependency
- If Dual Package Hazard is not a concern for your use case

**Why bc-ur chose bundling**:
- Avoids peer dependency
- Guaranteed version compatibility
- No Dual Package Hazard
- Works in all environments

---

## 🔧 Current Workaround (Browser-Only Fix)

**What I did** (in `/home/irfan/code/clone/bcur.me/node_modules/@ngraveio/bc-ur/`):

### Fix 1: Update cbor2.js to use local ESM version
```javascript
// dist/esm/wrappers/cbor2.js (BEFORE)
export { decode, encode, Tag, registerEncoder, comment, diagnose } from "../../commonjs/wrappers/cbor2Wrapper.js";

// dist/esm/wrappers/cbor2.js (AFTER - my fix)
export { decode, encode, Tag, registerEncoder, comment, diagnose } from "./cbor2Wrapper.js";
```

### Fix 2: Create bundled ESM cbor2Wrapper
```bash
# Convert CommonJS bundled version to ESM
sed '1d; s/^exports\./export const /; s/ = \([^;]*\);$/ = \1;/' \
  dist/commonjs/wrappers/cbor2Wrapper.js > dist/esm/wrappers/cbor2Wrapper-fixed.js
```

### Fix 3: Update cbor2Wrapper.js to use bundled version
```javascript
// dist/esm/wrappers/cbor2Wrapper.js (BEFORE)
import { decode, encode, Tag, comment, diagnose } from 'cbor2';
import { registerEncoder } from 'cbor2/encoder';
export { decode, encode, Tag, registerEncoder, comment, diagnose };

// dist/esm/wrappers/cbor2Wrapper.js (AFTER - my fix)
export { decode, encode, Tag, registerEncoder, comment, diagnose } from "./cbor2Wrapper-fixed.js";
```

### Fix 4: Import map for remaining CommonJS packages
```javascript
// index.html
const devImports = {
  "@ngraveio/bc-ur": "/node_modules/@ngraveio/bc-ur/dist/esm/index.js",
  // Use esm.sh for CommonJS-only packages
  "buffer": "https://esm.sh/buffer@6.0.3",
  "buffer/": "https://esm.sh/buffer@6.0.3/",
  "sha.js": "https://esm.sh/sha.js@2.4.12",
  "qrcode": "https://esm.sh/qrcode@1.5.3",
  // Local packages for pure ESM
  "uint8array-extras": "/node_modules/uint8array-extras/index.js",
  "crc": "/node_modules/crc/mjs/index.js",
  "qr-scanner": "/node_modules/qr-scanner/qr-scanner.min.js"
};
```

**Result**:
- ✅ bc-ur works in browser with local package
- ✅ No esm.sh needed for bc-ur (only for actual CommonJS packages)
- ✅ No Dual Package Hazard (using bundled ESM version)
- ⚠️ Requires manual patching after `yarn install` (not ideal)

---

## 🧪 Testing the Fix

### Test 1: Verify ESM imports work
```javascript
import { UR, BytewordEncoding } from '@ngraveio/bc-ur';

const testData = { id: 123, name: 'John Doe' };
const ur = UR.fromData({ type: 'user', payload: testData });
console.log(ur.toString()); // Should output UR string
```

### Test 2: Verify no CommonJS references
```bash
# Should return empty (no references to ../../commonjs/)
grep -r "../../commonjs" node_modules/@ngraveio/bc-ur/dist/esm/
```

### Test 3: Verify Node.js compatibility
```javascript
// Node.js (should still work)
const { UR } = require('@ngraveio/bc-ur');
// Uses dist/commonjs/index.js with bundled CBOR2

import { UR } from '@ngraveio/bc-ur';
// Uses dist/esm/index.js with fixed bundled CBOR2
```

---

## 📋 Implementation Checklist (for bc-ur maintainers)

- [ ] Update Rollup config to bundle CBOR2 for both ESM and CommonJS
- [ ] Generate `dist/esm/wrappers/cbor2Wrapper.js` with bundled ESM code
- [ ] Update `dist/esm/wrappers/cbor2.js` to import from `./cbor2Wrapper.js`
- [ ] Remove all `../../commonjs/` references from ESM build
- [ ] Test in browsers (Chrome, Firefox, Safari)
- [ ] Test in Node.js (CommonJS and ESM modes)
- [ ] Test that Dual Package Hazard is avoided (instanceof checks, CBOR tag registry)
- [ ] Update documentation about build process
- [ ] Add browser compatibility note to README

---

## 🔗 References

- [Dual Package Hazard (Node.js docs)](https://nodejs.org/docs/latest-v18.x/api/packages.html#dual-package-hazard)
- [cbor2 Issue #57](https://github.com/hildjj/cbor2/pull/57) - Background on dual packaging
- [BC-UR README](./reference_projects/bc-ur/README.md#technical-choices) - Explains intended approach
- [Import Maps Spec](https://github.com/WICG/import-maps) - Browser import resolution

---

## 💡 Summary

**Current Issue**: ESM build references CommonJS files, breaking browsers  
**Proper Fix**: Bundle CBOR2 separately for ESM (like CommonJS already does)  
**Alternative**: Use ESM cbor2 directly (but loses Dual Package Hazard protection)  
**My Workaround**: Manual patches to convert CommonJS bundle to ESM  

**For bc-ur maintainers**: Implement Option 1 (separate bundled versions) for production-ready fix.
